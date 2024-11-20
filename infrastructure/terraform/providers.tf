# Human Tasks:
# 1. Ensure all provider API tokens and credentials are securely stored in environment variables or terraform.tfvars
# 2. Verify Vercel team ID is correctly configured for organization-level deployments
# 3. Confirm Supabase project reference ID matches the target project
# 4. Validate Upstash account credentials and region settings

# Addresses requirement: Cloud Infrastructure (5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture)
# Configures core cloud providers for the Case Interview Practice Platform

# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
# Remote backend configuration for reliable state management and team collaboration
terraform {
  backend "remote" {
    organization = "case-interview-platform"

    workspaces {
      prefix = "case-interview-"
    }
  }
}

# Addresses requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Provider configurations with optimized settings for <200ms API response time

# Vercel provider configuration for NextJS hosting
# Provider version: ~> 1.0
provider "vercel" {
  # Secure API token for Vercel authentication
  api_token = var.vercel_api_token

  # Team ID for organization-level access
  team = var.vercel_team_id
}

# Supabase provider configuration for database and auth services
# Provider version: ~> 1.0
provider "supabase" {
  # Access token for Supabase service management
  access_token = var.supabase_access_token

  # Project reference ID for resource identification
  project_ref = var.supabase_project_ref

  # Secure database password for root access
  db_password = var.supabase_db_password
}

# Upstash provider configuration for Redis caching
# Provider version: ~> 1.0
provider "upstash" {
  # API key for service authentication
  api_key = var.upstash_api_key

  # Account email for API access
  email = var.upstash_email
}