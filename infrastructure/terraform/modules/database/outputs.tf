# Output values for the Supabase PostgreSQL database infrastructure module
# Implements requirements from:
# - 5.2 Component Details/Database Layer: Exposes database connection details
# - 4.3 Databases & Storage: Provides secure database connectivity information
# - 2. System Overview/Success Criteria: Supports performance requirements through connection pooling

output "database_id" {
  description = "Unique identifier of the Supabase PostgreSQL database project for the Case Interview Practice Platform"
  value       = supabase_project.id
  sensitive   = false
}

output "database_url" {
  description = "Secure PostgreSQL connection URL with connection pooling enabled for optimal performance"
  value       = supabase_project.database_url
  sensitive   = true # Marked sensitive to prevent exposure in logs
}

output "api_url" {
  description = "Supabase API URL for secure database access with real-time capabilities"
  value       = supabase_project.api_url
  sensitive   = false
}