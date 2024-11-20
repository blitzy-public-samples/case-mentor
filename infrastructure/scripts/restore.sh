#!/bin/bash

# Human Tasks:
# 1. Ensure AWS credentials are configured with appropriate S3 access permissions
# 2. Verify Supabase project credentials are available in environment
# 3. Configure Resend API key for email notifications
# 4. Set up required directories with appropriate permissions
# 5. Verify PostgreSQL client tools (pg_restore) are installed

# Required tool versions:
# - postgresql-client v14
# - aws-cli v2.x
# - resend-cli v1.x

# Global variables
RESTORE_DIR="/var/restore/case-interview-platform"
S3_BUCKET="case-interview-platform-backups"
LOG_FILE="/var/log/case-interview-platform/restore.log"
MAX_RETRIES=3
BACKUP_RETENTION_DAYS=30

# Initialize logging with timestamp and session ID
setup_logging() {
    local session_id=$(uuidgen)
    echo "=== Restore Session $session_id started at $(date -u '+%Y-%m-%d %H:%M:%S UTC') ===" >> "$LOG_FILE"
    echo "$session_id"
}

# Implements requirement: Database Layer Recovery - Environment setup
setup_restore_environment() {
    local session_id=$1
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Setting up restore environment..." >> "$LOG_FILE"

    # Create required directories
    mkdir -p "$RESTORE_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"

    # Validate required environment variables
    local required_vars=("SUPABASE_PROJECT_ID" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "RESEND_API_KEY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Required environment variable $var is not set" >> "$LOG_FILE"
            return 1
        fi
    done

    # Check for required tools
    local required_tools=("pg_restore" "aws" "resend")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Required tool $tool is not installed" >> "$LOG_FILE"
            return 1
        fi
    done

    # Verify AWS IAM permissions
    if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Unable to access S3 bucket $S3_BUCKET" >> "$LOG_FILE"
        return 1
    fi

    return 0
}

# Implements requirement: Data Security - Secure backup retrieval
download_from_s3() {
    local backup_timestamp=$1
    local session_id=$2
    local backup_file="$RESTORE_DIR/backup_${backup_timestamp}.dump"
    
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Downloading backup from S3..." >> "$LOG_FILE"

    # Validate backup timestamp format
    if ! [[ $backup_timestamp =~ ^[0-9]{14}$ ]]; then
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Invalid backup timestamp format" >> "$LOG_FILE"
        return 1
    }

    # Download encrypted backup with checksum verification
    if ! aws s3 cp "s3://$S3_BUCKET/backups/${backup_timestamp}.dump.enc" "${backup_file}.enc" --expected-size $(aws s3 head-object --bucket "$S3_BUCKET" --key "backups/${backup_timestamp}.dump.enc" --query 'ContentLength' --output text); then
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Failed to download backup file" >> "$LOG_FILE"
        return 1
    }

    # Decrypt backup using AWS KMS
    if ! aws kms decrypt --ciphertext-blob fileb://"${backup_file}.enc" --output text --query Plaintext | base64 -d > "$backup_file"; then
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Failed to decrypt backup file" >> "$LOG_FILE"
        rm -f "${backup_file}.enc"
        return 1
    }

    # Verify checksum
    local expected_checksum=$(aws s3 cp "s3://$S3_BUCKET/backups/${backup_timestamp}.checksum" -)
    local actual_checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
    if [[ "$expected_checksum" != "$actual_checksum" ]]; then
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Backup file checksum verification failed" >> "$LOG_FILE"
        rm -f "$backup_file" "${backup_file}.enc"
        return 1
    }

    rm -f "${backup_file}.enc"
    echo "$backup_file"
}

# Implements requirement: Database Layer Recovery - Backup verification
verify_backup_integrity() {
    local backup_file=$1
    local session_id=$2
    
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Verifying backup integrity..." >> "$LOG_FILE"

    # Check if backup file exists and is readable
    if [[ ! -r "$backup_file" ]]; then
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Backup file not found or not readable" >> "$LOG_FILE"
        return 1
    }

    # Verify backup format and version compatibility
    if ! pg_restore --list "$backup_file" &> /dev/null; then
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Invalid backup format" >> "$LOG_FILE"
        return 1
    }

    # Check for required database objects
    local required_objects=("public.users" "public.subscriptions" "public.drill_attempts")
    for obj in "${required_objects[@]}"; do
        if ! pg_restore --list "$backup_file" | grep -q "$obj"; then
            echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Required object $obj not found in backup" >> "$LOG_FILE"
            return 1
        fi
    done

    return 0
}

# Implements requirement: Database Layer Recovery - Restoration process
perform_database_restore() {
    local backup_file=$1
    local target_database=$2
    local session_id=$3
    local retry_count=0
    local backoff=5

    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Starting database restoration..." >> "$LOG_FILE"

    # Create restore point
    local restore_point="pre_restore_$(date +%Y%m%d_%H%M%S)"
    if ! psql "$target_database" -c "SELECT pg_create_restore_point('$restore_point');" &>> "$LOG_FILE"; then
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: Failed to create restore point" >> "$LOG_FILE"
        return 1
    }

    # Attempt restoration with retries
    while [[ $retry_count -lt $MAX_RETRIES ]]; do
        if pg_restore --clean --if-exists --no-owner --no-privileges --jobs=4 --verbose "$backup_file" --dbname="$target_database" &>> "$LOG_FILE"; then
            # Verify restoration success
            if psql "$target_database" -c "SELECT COUNT(*) FROM users;" &>> "$LOG_FILE"; then
                # Send success notification
                resend emails:send \
                    --from="noreply@case-interview-platform.com" \
                    --to="admin@case-interview-platform.com" \
                    --subject="Database Restore Completed Successfully" \
                    --text="Database restore completed successfully at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
                return 0
            fi
        fi

        retry_count=$((retry_count + 1))
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Restore attempt $retry_count failed, retrying in ${backoff}s..." >> "$LOG_FILE"
        sleep $backoff
        backoff=$((backoff * 3))
    done

    # Send failure notification
    resend emails:send \
        --from="noreply@case-interview-platform.com" \
        --to="admin@case-interview-platform.com" \
        --subject="Database Restore Failed" \
        --text="Database restore failed after $MAX_RETRIES attempts at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

    return 1
}

# Implements requirement: Data Security - Secure cleanup
cleanup_restore_files() {
    local session_id=$1
    local files_cleaned=0
    
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Cleaning up temporary files..." >> "$LOG_FILE"

    # Securely remove backup files older than retention period
    find "$RESTORE_DIR" -type f -name "backup_*.dump" -mtime +$BACKUP_RETENTION_DAYS -exec shred -u {} \; -print | while read file; do
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Removed file: $file" >> "$LOG_FILE"
        files_cleaned=$((files_cleaned + 1))
    done

    # Archive logs older than retention period
    find "$(dirname "$LOG_FILE")" -type f -name "restore_*.log" -mtime +$BACKUP_RETENTION_DAYS -exec gzip {} \;

    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Cleanup completed. Files cleaned: $files_cleaned" >> "$LOG_FILE"
    return $files_cleaned
}

# Main restoration function
restore_database() {
    local backup_timestamp=$1
    local session_id=$(setup_logging)

    # Setup environment
    if ! setup_restore_environment "$session_id"; then
        echo "Failed to setup restore environment. Check $LOG_FILE for details."
        return 1
    fi

    # Download backup
    local backup_file
    backup_file=$(download_from_s3 "$backup_timestamp" "$session_id")
    if [[ $? -ne 0 ]]; then
        echo "Failed to download backup. Check $LOG_FILE for details."
        return 2
    fi

    # Verify backup integrity
    if ! verify_backup_integrity "$backup_file" "$session_id"; then
        echo "Backup verification failed. Check $LOG_FILE for details."
        return 3
    fi

    # Perform restoration
    if ! perform_database_restore "$backup_file" "$database_url" "$session_id"; then
        echo "Database restoration failed. Check $LOG_FILE for details."
        return 4
    fi

    # Cleanup
    cleanup_restore_files "$session_id"

    echo "Database restoration completed successfully. Check $LOG_FILE for details."
    return 0
}

# Execute restoration if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -ne 1 ]]; then
        echo "Usage: $0 <backup_timestamp>"
        echo "Example: $0 20240115120000"
        exit 1
    fi

    restore_database "$1"
    exit $?
fi