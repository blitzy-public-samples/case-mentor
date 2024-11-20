# Required providers and versions
terraform {
  required_providers {
    # Supabase provider v1.0 for storage management
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
  required_version = "~> 1.0"
}

# REQ: File Storage Infrastructure (4.3 DATABASES & STORAGE/File Storage)
# Retrieve Supabase project information for storage configuration
data "supabase_project" "this" {
  project_id = var.project_id
}

# REQ: File Storage Infrastructure (4.3 DATABASES & STORAGE/File Storage)
# REQ: Data Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
# Storage bucket for profile images with Confidential data classification
resource "supabase_storage_bucket" "profile_images" {
  name                  = "profile-images-${var.environment}"
  project_id           = var.project_id
  public               = false
  file_size_limit      = var.profile_images_size_limit
  allowed_mime_types   = [
    "image/jpeg",
    "image/png",
    "image/gif"
  ]
  versioning_enabled   = var.bucket_versioning_enabled
  max_versions_per_file = var.max_versions_per_file

  # REQ: Storage Performance (2. SYSTEM OVERVIEW/Success Criteria)
  # Configure caching for optimal performance
  cache_control = "max-age=3600"

  # Configure CORS rules for secure access
  cors_rules {
    allowed_origins    = ["*"]
    allowed_methods    = ["GET", "POST", "PUT", "DELETE"]
    allowed_headers    = ["*"]
    max_age_seconds   = 3600
  }
}

# REQ: File Storage Infrastructure (4.3 DATABASES & STORAGE/File Storage)
# REQ: Data Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
# Storage bucket for drill attachments with Internal data classification
resource "supabase_storage_bucket" "drill_attachments" {
  name                  = "drill-attachments-${var.environment}"
  project_id           = var.project_id
  public               = false
  file_size_limit      = var.drill_attachments_size_limit
  allowed_mime_types   = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]
  versioning_enabled   = var.bucket_versioning_enabled
  max_versions_per_file = var.max_versions_per_file

  # REQ: Storage Performance (2. SYSTEM OVERVIEW/Success Criteria)
  # Configure caching for optimal performance
  cache_control = "max-age=3600"

  # Configure CORS rules for secure access - read-only
  cors_rules {
    allowed_origins    = ["*"]
    allowed_methods    = ["GET"]
    allowed_headers    = ["*"]
    max_age_seconds   = 3600
  }
}

# REQ: Data Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
# Access policy for profile images enforcing Confidential data classification controls
resource "supabase_storage_policy" "profile_images" {
  bucket_id          = supabase_storage_bucket.profile_images.id
  roles              = var.storage_access_roles
  allowed_operations = ["SELECT", "INSERT", "UPDATE", "DELETE"]
  owner_only         = true
  
  # Enforce owner-only access and file validation
  definition         = "auth.uid() = owner"
  check_conditions   = "file_size <= ${var.profile_images_size_limit} AND mime_type = ANY(${jsonencode(var.allowed_mime_types)})"
}

# REQ: Data Security Controls (8.2 DATA SECURITY/8.2.1 Data Classification)
# Access policy for drill attachments enforcing Internal data classification controls
resource "supabase_storage_policy" "drill_attachments" {
  bucket_id          = supabase_storage_bucket.drill_attachments.id
  roles              = var.storage_access_roles
  allowed_operations = ["SELECT"]
  owner_only         = false
  
  # Enforce authenticated access and file validation
  definition         = "auth.role() = 'authenticated'"
  check_conditions   = "file_size <= ${var.drill_attachments_size_limit} AND mime_type = ANY(${jsonencode(var.allowed_mime_types)})"
}