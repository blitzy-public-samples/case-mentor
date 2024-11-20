# Human Tasks:
# 1. Verify S3 bucket exists for Terraform state storage
# 2. Ensure DynamoDB table is created for state locking
# 3. Confirm production instance sizes meet performance requirements
# 4. Validate read replica count matches availability requirements
# 5. Review storage size limits align with business needs

# Addresses requirement: Production Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT/Environment Distribution)
# Configures production infrastructure with high availability and redundancy
terraform {
  required_version = "~> 1.5.0"

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

  # Addresses requirement: Data Security (8.2 DATA SECURITY/8.2.1 Data Classification)
  # Configures encrypted remote state storage
  backend "s3" {
    bucket         = "case-interview-platform-tfstate"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Addresses requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Production environment configuration with optimized resource sizing
locals {
  environment = "production"
  project_name = "case-interview-platform-prod"

  # High-performance database configuration for <200ms response time
  database_config = {
    instance_size = "db-8cpu-16gb"
    max_connections = 200
    read_replicas = 2
  }

  # Redis cache configuration for optimal performance
  redis_config = {
    instance_size = "cache.t3.large"
    memory_size = "4gb"
    max_connections = 1000
  }

  # Storage configuration with defined limits
  storage_config = {
    profile_images_size_limit = 5242880     # 5MB
    drill_attachments_size_limit = 10485760 # 10MB
  }
}

# Addresses requirement: Production Environment Configuration
# Database module with high availability configuration
module "database" {
  source = "../../modules/database"

  project_name = local.project_name
  environment = local.environment
  instance_size = local.database_config.instance_size
  max_connections = local.database_config.max_connections
  read_replicas = local.database_config.read_replicas
}

# Addresses requirement: System Performance
# Redis cache module with production sizing
module "cache" {
  source = "../../modules/cache"

  project_name = local.project_name
  environment = local.environment
  instance_size = local.redis_config.instance_size
  memory_size = local.redis_config.memory_size
  max_connections = local.redis_config.max_connections
}

# Addresses requirement: Data Security
# Storage module with enforced size limits
module "storage" {
  source = "../../modules/storage"

  project_name = local.project_name
  environment = local.environment
  profile_images_size_limit = local.storage_config.profile_images_size_limit
  drill_attachments_size_limit = local.storage_config.drill_attachments_size_limit
}

# Output configurations for service access
output "database_url" {
  description = "Production database connection URL"
  value       = module.database.database_url
  sensitive   = true
}

output "redis_url" {
  description = "Production Redis connection URL"
  value       = module.cache.redis_url
  sensitive   = true
}

output "storage_url" {
  description = "Production storage service URL"
  value       = module.storage.storage_url
}