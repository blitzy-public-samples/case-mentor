# Human Tasks:
# 1. Verify staging environment resource sizing meets pre-production testing requirements
# 2. Ensure S3 backend bucket and DynamoDB table are provisioned
# 3. Confirm staging environment tags comply with organization standards
# 4. Review Redis TTL settings for staging cache requirements
# 5. Validate storage bucket MIME type restrictions

# Addresses requirement: Staging Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT/Environment Distribution)
# Terraform configuration for staging environment with appropriate resource sizing and security controls

terraform {
  # Configure S3 backend for state management
  backend "s3" {
    bucket         = "case-interview-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }

  # Required providers are inherited from root module
  required_providers {
    vercel = {
      source  = "vercel/vercel"      # version ~> 1.0
    }
    supabase = {
      source  = "supabase/supabase"  # version ~> 1.0
    }
    upstash = {
      source  = "upstash/upstash"    # version ~> 1.0
    }
  }
}

# Addresses requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
# Local variables for staging-specific configuration
locals {
  environment            = "staging"
  project_name          = "case-interview-platform-staging"
  database_instance_size = "db-2cpu-4gb"
  redis_instance_size   = "cache.t3.small"
  redis_ttl             = 3600
  storage_bucket_name   = "case-interview-assets-staging"
  
  common_tags = {
    Project     = "Case Interview Platform"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

# Database module configuration for staging environment
module "database" {
  source = "../../modules/database"
  
  project_name           = local.project_name
  environment           = local.environment
  instance_size         = local.database_instance_size
  max_connections       = 50
  backup_retention_days = 7
  point_in_time_recovery = true
}

# Cache module configuration for staging environment
module "cache" {
  source = "../../modules/cache"
  
  project_name      = local.project_name
  environment      = local.environment
  instance_size    = local.redis_instance_size
  ttl             = local.redis_ttl
  max_memory      = "2gb"
  max_connections = 100
}

# Storage module configuration for staging environment
module "storage" {
  source = "../../modules/storage"
  
  project_name       = local.project_name
  environment       = local.environment
  bucket_name       = local.storage_bucket_name
  max_file_size     = "10MB"
  allowed_mime_types = [
    "image/jpeg",
    "image/png",
    "application/pdf"
  ]
}

# Output configurations for staging environment
output "vercel_deployment_url" {
  description = "URL of the staging Vercel deployment for application access"
  value       = module.vercel.deployment_url
}

output "supabase_api_url" {
  description = "Supabase API URL for staging environment database and auth access"
  value       = module.database.supabase_api_url
}

output "redis_connection_url" {
  description = "Redis connection URL for staging environment cache access"
  value       = module.cache.redis_url
  sensitive   = true
}