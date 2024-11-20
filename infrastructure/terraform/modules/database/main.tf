# Terraform module for Supabase PostgreSQL database infrastructure
# Implements requirements from:
# - 5.2 Component Details/Database Layer: Supabase PostgreSQL with horizontal read replicas
# - 4.3 Databases & Storage: Relational schema, horizontal scaling, automated backups

# Human Tasks:
# 1. Generate and securely store the Supabase database password
# 2. Configure AWS credentials for backup access
# 3. Verify selected AWS region supports all required services
# 4. Ensure proper IAM roles and permissions are set up for AWS Backup

# Required providers configuration
terraform {
  required_providers {
    # Supabase provider v1.0 for PostgreSQL database provisioning
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    # AWS provider v5.0 for infrastructure resources
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Input variables with validation
variable "project_name" {
  description = "Name of the Supabase project"
  type        = string
  validation {
    condition     = length(var.project_name) > 0 && length(var.project_name) <= 50
    error_message = "Project name must be between 1 and 50 characters"
  }
}

variable "supabase_db_password" {
  description = "Password for the Supabase database"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.supabase_db_password) >= 16
    error_message = "Database password must be at least 16 characters long"
  }
}

variable "region" {
  description = "AWS region for the Supabase project"
  type        = string
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d$", var.region))
    error_message = "Region must be a valid AWS region identifier"
  }
}

variable "database_instance_size" {
  description = "Size/tier of the database instance"
  type        = string
  validation {
    condition     = contains(["free", "small", "medium", "large"], var.database_instance_size)
    error_message = "Database instance size must be one of: free, small, medium, large"
  }
}

# Supabase project resource with PostgreSQL database
# Implements horizontal read replicas and automated backups
resource "supabase_project" "supabase_project" {
  name              = var.project_name
  database_password = var.supabase_db_password
  region           = var.region
  pricing_tier     = var.database_instance_size

  # Configure horizontal scaling with 2 read replicas
  db_replicas = 2

  # Configure daily automated backups with 30-day retention
  backup_schedule = {
    enabled            = true
    retention_days     = 30
    schedule_expression = "cron(0 0 * * ? *)"  # Daily at midnight UTC
  }

  # Database settings for production readiness
  settings = {
    postgres_version       = "14"  # Latest stable PostgreSQL version
    point_in_time_recovery = true  # Enable point-in-time recovery
    connection_pooling     = true  # Enable connection pooling for better performance
    realtime_enabled      = true   # Enable real-time subscriptions
    direct_user_access    = false  # Disable direct user access for security
    db_ssl_enforcement    = true   # Enforce SSL connections
  }
}

# Additional AWS backup plan for enhanced data protection
resource "aws_backup_plan" "supabase_database_backup" {
  name = "${var.project_name}-backup"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = "Default"  # Use default AWS Backup vault
    schedule          = "cron(0 5 ? * * *)"  # Daily at 5 AM UTC
    
    start_window      = 60  # Start backup within 60 minutes
    completion_window = 120 # Complete backup within 120 minutes

    lifecycle {
      delete_after = 30  # 30-day retention policy
    }
  }
}

# Output values for use by other modules
output "supabase_project_id" {
  description = "ID of the created Supabase project"
  value       = supabase_project.supabase_project.id
}

output "supabase_database_url" {
  description = "URL for connecting to the Supabase database"
  value       = supabase_project.supabase_project.database_url
  sensitive   = true
}

output "supabase_api_url" {
  description = "URL for the Supabase API"
  value       = supabase_project.supabase_project.api_url
}