# Human Tasks:
# 1. Verify that sensitive outputs are properly handled in CI/CD pipelines
# 2. Ensure application configuration can securely consume these output values
# 3. Validate that connection strings are properly formatted for client libraries
# 4. Review access patterns to sensitive outputs and implement proper access controls

# Addresses requirement: System Architecture Integration (5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture)
# Exposes integration points between core platform services with secure credential management

# Vercel deployment URL output
# Provides the public endpoint for accessing the deployed application
output "deployment_url" {
  description = "The URL where the application is deployed on Vercel"
  value       = vercel_project.deployment_url
  sensitive   = false
}

# Supabase API endpoint URL output
# Enables client-side database and auth service integration
output "supabase_api_url" {
  description = "The Supabase project API endpoint URL for database and auth access"
  value       = module.database.supabase_api_url
  sensitive   = false
}

# Supabase database connection URL output
# Provides secure database access with connection pooling enabled
output "supabase_database_url" {
  description = "The PostgreSQL database connection URL with secure credentials"
  value       = module.database.database_url
  sensitive   = true # Protected to prevent credential exposure
}

# Redis connection URL output
# Enables secure cache access with authentication
output "redis_connection_url" {
  description = "The Redis cache connection URL with secure authentication"
  value       = module.cache.redis_connection_string
  sensitive   = true # Protected to prevent credential exposure
}

# Redis host output
# Provides connection host details for cache configuration
output "redis_host" {
  description = "The Redis cache instance hostname for connection configuration"
  value       = module.cache.redis_host
  sensitive   = false
}