#!/bin/bash

# Human Tasks:
# 1. Configure AWS CLI with appropriate credentials and region
# 2. Set up OpenSSL with proper version (1.1.1 or higher recommended)
# 3. Create backup directory with appropriate permissions: /backup/keys
# 4. Configure environment variables for AWS Secrets Manager ARNs
# 5. Set up monitoring for key rotation failures
# 6. Configure alerting for failed rotation attempts

# Requirement: Security Controls - Implementation of key rotation for JWT signing keys and API keys
# Requirement: Key Management - Automated key rotation with specified rotation periods

# Import relative path helper
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

# Source environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Global constants
KEY_TYPES=('jwt' 'api' 'database' 'stripe')
declare -A ROTATION_PERIODS=(
    ['jwt']='30d'
    ['api']='180d'
    ['database']='90d'
    ['stripe']='180d'
)
BACKUP_DIR="/backup/keys"

# Logging setup
LOG_FILE="/var/log/key-rotation.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Requirement: Security Controls - Key rotation for JWT signing keys
rotate_jwt_keys() {
    log "Starting JWT key rotation..."
    
    # Generate new RSA-256 key pair
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local tmp_dir=$(mktemp -d)
    
    openssl genpkey -algorithm RSA -out "$tmp_dir/private_key.pem" -pkeyopt rsa_keygen_bits:2048
    openssl rsa -pubout -in "$tmp_dir/private_key.pem" -out "$tmp_dir/public_key.pem"
    
    if [ $? -ne 0 ]; then
        log "ERROR: Failed to generate new JWT key pair"
        rm -rf "$tmp_dir"
        return 1
    fi
    
    # Backup existing keys
    backup_keys "jwt" || return 1
    
    # Update AWS Secrets Manager
    aws secretsmanager update-secret --secret-id "${AWS_JWT_PRIVATE_KEY_ARN}" \
        --secret-string "$(cat "$tmp_dir/private_key.pem")" || return 1
        
    aws secretsmanager update-secret --secret-id "${AWS_JWT_PUBLIC_KEY_ARN}" \
        --secret-string "$(cat "$tmp_dir/public_key.pem")" || return 1
    
    # Verify new keys
    verify_rotation "jwt" || return 1
    
    rm -rf "$tmp_dir"
    log "JWT key rotation completed successfully"
    return 0
}

# Requirement: Key Management - API key rotation
rotate_api_keys() {
    log "Starting API key rotation..."
    
    # Generate new API keys
    local new_api_key=$(openssl rand -base64 32)
    
    # Backup existing keys
    backup_keys "api" || return 1
    
    # Update AWS Secrets Manager
    aws secretsmanager update-secret --secret-id "${AWS_API_KEY_ARN}" \
        --secret-string "$new_api_key" || return 1
    
    # Verify new keys
    verify_rotation "api" || return 1
    
    log "API key rotation completed successfully"
    return 0
}

# Requirement: Key Management - Database credential rotation
rotate_database_credentials() {
    log "Starting database credential rotation..."
    
    # Generate new secure password
    local new_password=$(openssl rand -base64 32)
    
    # Backup existing credentials
    backup_keys "database" || return 1
    
    # Update Supabase database password
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U "$SUPABASE_DB_USER" \
        -c "ALTER USER $SUPABASE_DB_USER WITH PASSWORD '$new_password';" || return 1
    
    # Update AWS Secrets Manager
    aws secretsmanager update-secret --secret-id "${AWS_DB_CREDENTIALS_ARN}" \
        --secret-string "{\"password\":\"$new_password\"}" || return 1
    
    # Verify new credentials
    verify_rotation "database" || return 1
    
    log "Database credential rotation completed successfully"
    return 0
}

# Requirement: Key Management - Secure key backup
backup_keys() {
    local key_type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/${key_type}_${timestamp}.enc"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Retrieve current keys from AWS Secrets Manager
    case "$key_type" in
        "jwt")
            aws secretsmanager get-secret-value --secret-id "${AWS_JWT_PRIVATE_KEY_ARN}" \
                --query 'SecretString' --output text > "$backup_path.private"
            aws secretsmanager get-secret-value --secret-id "${AWS_JWT_PUBLIC_KEY_ARN}" \
                --query 'SecretString' --output text > "$backup_path.public"
            ;;
        "api"|"database")
            aws secretsmanager get-secret-value --secret-id "${AWS_${key_type^^}_KEY_ARN}" \
                --query 'SecretString' --output text > "$backup_path"
            ;;
    esac
    
    # Encrypt backup
    openssl enc -aes-256-cbc -salt -in "$backup_path" -out "$backup_path.enc" \
        -pass "pass:${BACKUP_ENCRYPTION_KEY}"
    
    # Verify backup integrity
    if [ ! -f "$backup_path.enc" ]; then
        log "ERROR: Failed to create encrypted backup for $key_type"
        return 1
    fi
    
    # Cleanup unencrypted files
    rm -f "$backup_path" "$backup_path.private" "$backup_path.public"
    
    log "Created encrypted backup at $backup_path.enc"
    return 0
}

# Requirement: Key Management - Rotation verification
verify_rotation() {
    local key_type="$1"
    local success=0
    
    case "$key_type" in
        "jwt")
            # Test JWT token generation and verification
            local test_token=$(node -e "
                const jwt = require('$PROJECT_ROOT/src/backend/lib/auth/jwt');
                const testUser = {
                    id: 'test-user',
                    email: 'test@example.com',
                    subscriptionTier: 'FREE'
                };
                console.log(jwt.generateToken(testUser));
            ")
            
            if [ -z "$test_token" ]; then
                log "ERROR: Failed to generate test JWT token"
                return 1
            fi
            ;;
            
        "api")
            # Test API key authentication
            local test_response=$(curl -s -H "X-API-Key: $new_api_key" "${API_BASE_URL}/health")
            if [ $? -ne 0 ]; then
                log "ERROR: Failed to verify new API key"
                return 1
            fi
            ;;
            
        "database")
            # Test database connectivity
            PGPASSWORD="$new_password" psql -h "$SUPABASE_DB_HOST" -U "$SUPABASE_DB_USER" \
                -c "SELECT 1;" > /dev/null 2>&1
            if [ $? -ne 0 ]; then
                log "ERROR: Failed to verify database credentials"
                return 1
            fi
            ;;
    esac
    
    return 0
}

# Main rotation orchestration function
rotate_keys() {
    log "Starting key rotation process..."
    
    for key_type in "${KEY_TYPES[@]}"; do
        # Check if rotation is needed based on rotation period
        local last_rotation=$(aws secretsmanager describe-secret \
            --secret-id "${AWS_${key_type^^}_KEY_ARN}" \
            --query 'LastRotatedDate' --output text)
            
        local rotation_needed=false
        if [ -z "$last_rotation" ]; then
            rotation_needed=true
        else
            local period="${ROTATION_PERIODS[$key_type]}"
            local days=${period%d}
            local last_rotation_seconds=$(date -d "$last_rotation" +%s)
            local current_seconds=$(date +%s)
            local diff_days=$(( ($current_seconds - $last_rotation_seconds) / 86400 ))
            
            if [ $diff_days -ge $days ]; then
                rotation_needed=true
            fi
        fi
        
        if [ "$rotation_needed" = true ]; then
            log "Rotating $key_type keys..."
            case "$key_type" in
                "jwt")
                    rotate_jwt_keys || exit 1
                    ;;
                "api")
                    rotate_api_keys || exit 1
                    ;;
                "database")
                    rotate_database_credentials || exit 1
                    ;;
            esac
        else
            log "Skipping $key_type key rotation - not due yet"
        fi
    done
    
    log "Key rotation process completed"
    return 0
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    rotate_keys
fi