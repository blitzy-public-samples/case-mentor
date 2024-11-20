#!/bin/bash

# Human Tasks:
# 1. Ensure PostgreSQL client tools (pg_dump v14) are installed
# 2. Configure AWS CLI v2.x with appropriate credentials
# 3. Create S3 bucket with appropriate encryption and lifecycle policies
# 4. Set up IAM role with necessary S3 permissions
# 5. Create log directory with appropriate permissions
# 6. Configure environment variables for database connection

# Required tool versions:
# - postgresql-client v14
# - aws-cli v2.x

# Implements requirements from:
# - 5.2 Component Details/Database Layer: Daily snapshots, point-in-time recovery
# - 8.2 Data Security/Data Classification: Protection of confidential user data through secure backup mechanisms

# Global variables
BACKUP_DIR="/var/backup/case-interview-platform"
S3_BUCKET="case-interview-platform-backups"
LOG_FILE="/var/log/case-interview-platform/backup.log"
RETENTION_DAYS=30
MAX_RETRIES=3

# Logging function with timestamps
log() {
    local level=$1
    local message=$2
    echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') [$level] $message" >> "$LOG_FILE"
}

# Setup backup environment and validate requirements
setup_backup_environment() {
    log "INFO" "Starting backup environment setup"
    
    # Create required directories with secure permissions
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"
    
    mkdir -p "$(dirname "$LOG_FILE")"
    chmod 700 "$(dirname "$LOG_FILE")"
    
    # Validate required environment variables
    if [[ -z "$BACKUP_DIR" || -z "$S3_BUCKET" || -z "$LOG_FILE" ]]; then
        log "ERROR" "Required environment variables not set"
        return 1
    }
    
    # Check for required tools
    if ! command -v pg_dump &> /dev/null; then
        log "ERROR" "pg_dump not found. Please install postgresql-client v14"
        return 1
    }
    
    if ! command -v aws &> /dev/null; then
        log "ERROR" "aws-cli not found. Please install aws-cli v2.x"
        return 1
    }
    
    # Validate tool versions
    PG_VERSION=$(pg_dump --version | grep -oP '\d+' | head -1)
    if [[ "$PG_VERSION" != "14" ]]; then
        log "ERROR" "Incorrect pg_dump version. Required: 14, Found: $PG_VERSION"
        return 1
    }
    
    AWS_VERSION=$(aws --version | grep -oP '2\.\d+\.\d+' | cut -d'.' -f1)
    if [[ "$AWS_VERSION" != "2" ]]; then
        log "ERROR" "Incorrect aws-cli version. Required: 2.x"
        return 1
    }
    
    log "INFO" "Backup environment setup completed successfully"
    return 0
}

# Perform database backup with consistent snapshot
perform_database_backup() {
    local backup_timestamp=$1
    local backup_file="${BACKUP_DIR}/backup_${backup_timestamp}.dump"
    local checksum_file="${backup_file}.sha256"
    
    log "INFO" "Starting database backup: $backup_file"
    
    # Execute pg_dump with consistent snapshot and compression
    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "${database_host}" \
        -U "${DB_USER}" \
        -d "${database_url}" \
        -F c \
        --clean \
        --if-exists \
        --snapshot \
        --verbose \
        --file="$backup_file" 2>> "$LOG_FILE"
    
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Database backup failed"
        return 1
    }
    
    # Generate SHA256 checksum
    sha256sum "$backup_file" > "$checksum_file"
    
    # Set secure file permissions
    chmod 600 "$backup_file" "$checksum_file"
    
    # Log backup size
    local backup_size=$(du -h "$backup_file" | cut -f1)
    log "INFO" "Backup completed successfully. Size: $backup_size"
    
    echo "$backup_file"
}

# Upload backup to S3 with encryption and retry logic
upload_to_s3() {
    local backup_file=$1
    local retry_count=0
    local max_retries=$MAX_RETRIES
    local wait_time=5
    
    log "INFO" "Starting S3 upload: $backup_file"
    
    while [[ $retry_count -lt $max_retries ]]; do
        # Upload with server-side encryption
        aws s3 cp "$backup_file" "s3://${S3_BUCKET}/$(basename "$backup_file")" \
            --sse AES256 \
            --only-show-errors
        
        if [[ $? -eq 0 ]]; then
            # Upload checksum file
            aws s3 cp "${backup_file}.sha256" \
                "s3://${S3_BUCKET}/$(basename "$backup_file").sha256" \
                --sse AES256 \
                --only-show-errors
            
            if [[ $? -eq 0 ]]; then
                log "INFO" "Upload completed successfully"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -lt $max_retries ]]; then
            log "WARN" "Upload failed, retrying in $wait_time seconds (Attempt $retry_count of $max_retries)"
            sleep $wait_time
            wait_time=$((wait_time * 2))
        else
            log "ERROR" "Upload failed after $max_retries attempts"
            return 1
        fi
    done
    
    return 1
}

# Clean up old backup files
cleanup_old_backups() {
    local retention_days=$1
    local cleanup_count=0
    
    log "INFO" "Starting cleanup of backups older than $retention_days days"
    
    # Find and remove old local backup files
    find "$BACKUP_DIR" -type f -mtime "+$retention_days" -name "backup_*.dump*" | while read -r file; do
        rm -f "$file"
        cleanup_count=$((cleanup_count + 1))
        log "INFO" "Removed old backup: $file"
    done
    
    # Clean up old S3 backups using lifecycle rules
    # Note: S3 lifecycle rules should be configured separately via infrastructure as code
    
    log "INFO" "Cleanup completed. Removed $cleanup_count local backup files"
    return $cleanup_count
}

# Main backup function
backup_database() {
    local backup_timestamp=$(date -u '+%Y%m%d_%H%M%S')
    local exit_code=0
    
    log "INFO" "Starting backup process"
    
    # Setup environment
    setup_backup_environment
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Environment setup failed"
        return 1
    }
    
    # Perform backup
    local backup_file=$(perform_database_backup "$backup_timestamp")
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Backup creation failed"
        return 2
    }
    
    # Upload to S3
    upload_to_s3 "$backup_file"
    if [[ $? -ne 0 ]]; then
        log "ERROR" "S3 upload failed"
        return 3
    }
    
    # Cleanup old backups
    cleanup_old_backups "$RETENTION_DAYS"
    if [[ $? -eq 0 ]]; then
        log "ERROR" "Backup cleanup failed"
        return 4
    }
    
    log "INFO" "Backup process completed successfully"
    return 0
}

# Execute main backup function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    backup_database
    exit $?
fi