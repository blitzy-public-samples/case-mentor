# Human Tasks:
# 1. Ensure Vercel API token is available in environment or tfvars
# 2. Configure Supabase project URL and service role key
# 3. Set up Upstash account credentials
# 4. Review and configure default regions for each provider

# Addresses requirement: Infrastructure Management (5.1 High-Level Architecture)
# Ensures consistent infrastructure provisioning through version-controlled dependencies
terraform {
  # Enforce specific Terraform version for stability
  # Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
  required_version = "~> 1.5.0"

  # Define required providers with pinned versions
  # Addresses requirement: Deployment Architecture (5.5 Deployment Architecture)
  required_providers {
    # Vercel provider for NextJS application hosting and edge function deployment
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }

    # Supabase provider for PostgreSQL database, authentication, and storage management
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }

    # Upstash provider for Redis caching and session management
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
  }
}

# Provider configuration blocks with required and optional settings
provider "vercel" {
  # Authentication token for Vercel API access
  # Set via environment variable VERCEL_API_TOKEN or in terraform.tfvars
  api_token = var.vercel_api_token

  # Optional: Team identifier for organization-level deployments
  team = var.vercel_team_id

  # Default region for resource deployment
  default_region = var.vercel_default_region
}

provider "supabase" {
  # Supabase project URL for API access
  # Set via environment variable SUPABASE_API_URL or in terraform.tfvars
  api_url = var.supabase_api_url

  # Service role key for management operations
  # Set via environment variable SUPABASE_API_KEY or in terraform.tfvars
  api_key = var.supabase_api_key

  # Database password for root access
  # Set via environment variable SUPABASE_DB_PASSWORD or in terraform.tfvars
  db_password = var.supabase_db_password
}

provider "upstash" {
  # API key for Upstash authentication
  # Set via environment variable UPSTASH_API_KEY or in terraform.tfvars
  api_key = var.upstash_api_key

  # Account email for API access
  # Set via environment variable UPSTASH_EMAIL or in terraform.tfvars
  email = var.upstash_email

  # Region for Redis deployment
  # Set via environment variable UPSTASH_REGION or in terraform.tfvars
  region = var.upstash_region
}

# Variable declarations for provider configurations
variable "vercel_api_token" {
  description = "API token for Vercel authentication"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Optional team identifier for Vercel organization deployments"
  type        = string
  default     = null
}

variable "vercel_default_region" {
  description = "Default region for Vercel resource deployment"
  type        = string
}

variable "supabase_api_url" {
  description = "Supabase project URL for API access"
  type        = string
}

variable "supabase_api_key" {
  description = "Service role key for Supabase management operations"
  type        = string
  sensitive   = true
}

variable "supabase_db_password" {
  description = "Database password for Supabase root access"
  type        = string
  sensitive   = true
}

variable "upstash_api_key" {
  description = "API key for Upstash authentication"
  type        = string
  sensitive   = true
}

variable "upstash_email" {
  description = "Account email for Upstash API access"
  type        = string
}

variable "upstash_region" {
  description = "Region for Upstash Redis deployment"
  type        = string
}