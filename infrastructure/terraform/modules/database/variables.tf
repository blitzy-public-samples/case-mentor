# Human Tasks:
# 1. Review and adjust database instance sizes based on initial load testing results
# 2. Configure secure database password in terraform.tfvars or through environment variables
# 3. Validate backup retention requirements with compliance team
# 4. Assess connection pooling settings based on expected concurrent user load

# Addresses requirement: Database Layer Configuration (5.2 Component Details/Database Layer)
# Defines core database configuration variables with validation rules
variable "project_name" {
  description = "Name of the Case Interview Practice Platform project"
  type        = string
  default     = "case-interview-platform"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens"
  }
}

# Addresses requirement: Data Storage Requirements (4.3 Databases & Storage)
# Ensures database is deployed in supported regions
variable "region" {
  description = "Region for deploying the Supabase PostgreSQL database"
  type        = string

  validation {
    condition     = contains(["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"], var.region)
    error_message = "Region must be one of the supported Supabase regions"
  }
}

# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Configures database resources for optimal performance
variable "database_instance_size" {
  description = "Size of the Supabase PostgreSQL database instance"
  type        = string
  default     = "db-4cpu-8gb"

  validation {
    condition     = can(regex("^db-[0-9]+cpu-[0-9]+gb$", var.database_instance_size))
    error_message = "Database instance size must follow pattern: db-<cpu>cpu-<memory>gb"
  }
}

# Addresses requirement: Data Storage Requirements (4.3 Databases & Storage)
# Ensures secure database access
variable "supabase_db_password" {
  description = "Password for Supabase PostgreSQL database"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.supabase_db_password) >= 16
    error_message = "Database password must be at least 16 characters long"
  }
}

# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Configures backup retention for disaster recovery
variable "backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30

  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 7 and 35 days"
  }
}

# Addresses requirement: Database Layer Configuration (5.2 Component Details/Database Layer)
# Enables horizontal scaling through read replicas
variable "db_replicas" {
  description = "Number of read replicas for horizontal scaling"
  type        = number
  default     = 2

  validation {
    condition     = var.db_replicas >= 0 && var.db_replicas <= 5
    error_message = "Number of database replicas must be between 0 and 5"
  }
}

# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Configures point-in-time recovery for data protection
variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for the database"
  type        = bool
  default     = true
}

# Addresses requirement: Database Layer Configuration (5.2 Component Details/Database Layer)
# Optimizes database connection management
variable "enable_connection_pooling" {
  description = "Enable connection pooling for improved performance"
  type        = bool
  default     = true
}

# Addresses requirement: Data Storage Requirements (4.3 Databases & Storage)
# Enables real-time data synchronization capabilities
variable "enable_realtime" {
  description = "Enable real-time subscriptions feature"
  type        = bool
  default     = true
}