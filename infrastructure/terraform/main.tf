# Human Tasks:
# 1. Ensure all provider API tokens and credentials are configured in terraform.tfvars or environment variables
# 2. Verify resource sizing matches environment requirements (database_instance_size, redis_instance_size)
# 3. Review and adjust Redis TTL settings based on caching needs
# 4. Confirm storage bucket naming follows organization conventions
# 5. Validate environment-specific tags and naming patterns

# Addresses requirement: Infrastructure as Code (5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture)
# Main Terraform configuration for the Case Interview Practice Platform

# Import provider configurations
terraform {
  required_version = "~> 1.5.0"
  
  # Required providers are defined in versions.tf
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

# Addresses requirement: Deployment Environment (9.1 DEPLOYMENT ENVIRONMENT)
# Local variables for environment-specific configuration
locals {
  project_name = "case-interview-platform"
  environment  = terraform.workspace
  
  # Resource sizing configurations
  database_instance_size = "db-4cpu-8gb"
  redis_instance_size    = "cache.t3.medium"
  redis_ttl             = 3600
  storage_bucket_name   = "case-interview-assets"
  
  # Common tags for resource management
  common_tags = {
    Project     = "Case Interview Platform"
    Environment = terraform.workspace
    ManagedBy   = "Terraform"
  }
}

# Retrieve current workspace information
data "terraform_workspace" "current" {}

# Addresses requirement: Cloud Services Integration (4.2 FRAMEWORKS & LIBRARIES/Supporting Libraries)
# Database module configuration
module "database" {
  source = "./modules/database"
  
  project_name    = local.project_name
  environment     = local.environment
  instance_size   = local.database_instance_size
  max_connections = 100
}

# Cache module configuration
module "cache" {
  source = "./modules/cache"
  
  project_name   = local.project_name
  environment    = local.environment
  instance_size  = local.redis_instance_size
  ttl           = local.redis_ttl
}

# Storage module configuration
module "storage" {
  source = "./modules/storage"
  
  project_name = local.project_name
  environment  = local.environment
  bucket_name  = local.storage_bucket_name
}

# Vercel project configuration
resource "vercel_project" "project" {
  name      = local.project_name
  framework = "nextjs"
  
  environment = [
    {
      key   = "NEXT_PUBLIC_SUPABASE_URL"
      value = module.database.supabase_api_url
    },
    {
      key   = "NEXT_PUBLIC_REDIS_URL"
      value = module.cache.redis_url
    }
  ]
}

# Output configurations for service access
output "vercel_deployment_url" {
  description = "Vercel deployment URL for application access"
  value       = vercel_project.project.deployment_url
}

output "supabase_api_url" {
  description = "Supabase API URL for database and auth access"
  value       = module.database.supabase_api_url
}

output "redis_connection_url" {
  description = "Redis connection URL for cache access"
  value       = module.cache.redis_url
  sensitive   = true
}