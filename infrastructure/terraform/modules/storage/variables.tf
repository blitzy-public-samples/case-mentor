# Terraform variables configuration for Supabase storage module
# Required Terraform version: ~> 1.0

# REQ: File Storage Configuration (4.3 DATABASES & STORAGE/File Storage)
# Defines project-level configuration for Supabase storage
variable "project_id" {
  type        = string
  description = "Supabase project ID for storage configuration"
  validation {
    condition     = length(var.project_id) > 0
    error_message = "Project ID must not be empty"
  }
}

# REQ: File Storage Configuration (4.3 DATABASES & STORAGE/File Storage)
# Controls environment-specific storage configurations
variable "environment" {
  type        = string
  description = "Deployment environment (staging/production) for storage resource naming and configuration"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either staging or production"
  }
}

# REQ: Storage Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Configures size limits to maintain <200ms API response time target
variable "profile_images_size_limit" {
  type        = number
  description = "Maximum file size limit for profile images in bytes (default 5MB)"
  default     = 5242880 # 5MB
  validation {
    condition     = var.profile_images_size_limit <= 10485760 # 10MB
    error_message = "Profile image size limit must not exceed 10MB for performance optimization"
  }
}

# REQ: Storage Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Configures attachment size limits for optimal performance
variable "drill_attachments_size_limit" {
  type        = number
  description = "Maximum file size limit for drill attachments including case documents and data files in bytes (default 10MB)"
  default     = 10485760 # 10MB
  validation {
    condition     = var.drill_attachments_size_limit <= 20971520 # 20MB
    error_message = "Drill attachment size limit must not exceed 20MB to maintain system performance"
  }
}

# REQ: Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
# Defines access roles based on data classification levels
variable "storage_access_roles" {
  type        = list(string)
  description = "List of roles allowed to access storage buckets based on data classification levels"
  default     = ["authenticated"]
  validation {
    condition     = length(var.storage_access_roles) > 0
    error_message = "At least one storage access role must be defined for security"
  }
}

# REQ: File Storage Configuration (4.3 DATABASES & STORAGE/File Storage)
# Controls file versioning for data protection
variable "bucket_versioning_enabled" {
  type        = bool
  description = "Enable versioning for storage buckets to maintain file history"
  default     = true
}

# REQ: File Storage Configuration (4.3 DATABASES & STORAGE/File Storage)
# Limits version history for storage optimization
variable "max_versions_per_file" {
  type        = number
  description = "Maximum number of versions to keep per file"
  default     = 5
  validation {
    condition     = var.max_versions_per_file >= 1 && var.max_versions_per_file <= 10
    error_message = "Version limit must be between 1 and 10 versions per file"
  }
}

# REQ: Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
# Restricts file types for security
variable "allowed_mime_types" {
  type        = list(string)
  description = "List of allowed MIME types for file uploads"
  default = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]
}