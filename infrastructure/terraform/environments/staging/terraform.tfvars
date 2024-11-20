# Addresses requirement: Staging Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT/Environment Distribution)
# Project and environment identification
project_name = "case-interview-platform-staging"
environment  = "staging"

# Addresses requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
# Resource sizing for staging workloads with reduced capacity
database_instance_size = "db-2cpu-4gb"
redis_instance_size   = "cache.t3.small"
redis_ttl            = 3600

# Storage configuration for staging assets
storage_bucket_name = "case-interview-assets-staging"

# Addresses requirement: Security Configuration (8. SECURITY CONSIDERATIONS/8.1 Authentication and Authorization)
# Sensitive credentials for staging environment services
# Note: Replace placeholder values with actual credentials securely stored in a vault or CI/CD system
vercel_api_token       = "REPLACE_WITH_STAGING_VERCEL_API_TOKEN"
vercel_team_id        = "REPLACE_WITH_STAGING_VERCEL_TEAM_ID"
supabase_access_token = "REPLACE_WITH_STAGING_SUPABASE_ACCESS_TOKEN"
supabase_project_ref  = "REPLACE_WITH_STAGING_SUPABASE_PROJECT_REF"
supabase_db_password  = "REPLACE_WITH_STAGING_SUPABASE_DB_PASSWORD"
upstash_api_key      = "REPLACE_WITH_STAGING_UPSTASH_API_KEY"
upstash_email        = "REPLACE_WITH_STAGING_UPSTASH_EMAIL"