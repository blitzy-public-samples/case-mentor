# Human Tasks:
# 1. Ensure all sensitive variables are properly secured in terraform.tfvars or environment variables
# 2. Verify database and Redis instance sizes match available options in each environment
# 3. Configure appropriate TTL values based on caching requirements
# 4. Review storage bucket naming convention across environments

# Addresses requirement: Infrastructure Configuration (5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture)
# Defines core project configuration variables
variable "project_name" {
  description = "Name of the Case Interview Practice Platform project"
  type        = string
  default     = "case-interview-platform"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens"
  }
}

# Addresses requirement: Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT)
# Controls environment-specific configurations
variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production"
  }
}

# Addresses requirement: Security Configuration (8. SECURITY CONSIDERATIONS/8.1 Authentication and Authorization)
# Vercel authentication configuration
variable "vercel_api_token" {
  description = "API token for Vercel platform access, required by vercel provider (~> 1.0)"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Team ID for Vercel project deployment, required for organization deployments"
  type        = string
  sensitive   = true
}

# Supabase authentication and configuration variables
variable "supabase_access_token" {
  description = "Access token for Supabase service management, required by supabase provider (~> 1.0)"
  type        = string
  sensitive   = true
}

variable "supabase_project_ref" {
  description = "Project reference ID for Supabase project, used for resource identification"
  type        = string
  sensitive   = true
}

variable "supabase_db_password" {
  description = "Password for Supabase PostgreSQL database root access"
  type        = string
  sensitive   = true
}

# Upstash Redis authentication configuration
variable "upstash_api_key" {
  description = "API key for Upstash Redis service management, required by upstash provider (~> 1.0)"
  type        = string
  sensitive   = true
}

variable "upstash_email" {
  description = "Email address associated with Upstash account for API authentication"
  type        = string
  sensitive   = true
}

# Infrastructure sizing and configuration variables
variable "database_instance_size" {
  description = "Size of the Supabase PostgreSQL database instance"
  type        = string
  default     = "db-4cpu-8gb"

  validation {
    condition     = can(regex("^db-[0-9]+cpu-[0-9]+gb$", var.database_instance_size))
    error_message = "Database instance size must follow pattern: db-<cpu>cpu-<memory>gb"
  }
}

variable "redis_instance_size" {
  description = "Size of the Redis cache instance following AWS node type patterns"
  type        = string
  default     = "cache.t3.medium"

  validation {
    condition     = can(regex("^cache\\.[a-z0-9]+\\.[a-z]+$", var.redis_instance_size))
    error_message = "Redis instance size must follow AWS cache node type pattern"
  }
}

variable "redis_ttl" {
  description = "Default TTL for Redis cache entries in seconds"
  type        = number
  default     = 3600

  validation {
    condition     = var.redis_ttl >= 0 && var.redis_ttl <= 86400
    error_message = "Redis TTL must be between 0 and 86400 seconds (24 hours)"
  }
}

variable "storage_bucket_name" {
  description = "Name of the Supabase storage bucket for assets"
  type        = string
  default     = "case-interview-assets"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.storage_bucket_name))
    error_message = "Storage bucket name must contain only lowercase letters, numbers, and hyphens"
  }
}