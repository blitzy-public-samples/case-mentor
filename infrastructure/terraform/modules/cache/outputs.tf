# Human Tasks:
# 1. Verify Redis connection string format matches application client requirements
# 2. Ensure secure storage of connection string in application configuration
# 3. Monitor Redis host accessibility across all deployment regions
# 4. Validate port number is allowed through network security groups

# Output definitions for Redis cache module
# Addresses requirements:
# - Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
# - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# - Infrastructure Scaling (5.2 Component Details/Database Layer)

# Redis host output for global access configuration
# Addresses requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
output "redis_host" {
  description = "Redis cache instance hostname for global access"
  value       = upstash_redis_database.redis_cache.host
  sensitive   = false
}

# Redis port output for connection configuration
# Addresses requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
output "redis_port" {
  description = "Redis cache instance port number for connection configuration"
  value       = upstash_redis_database.redis_cache.port
  sensitive   = false
}

# Redis connection string output for secure application access
# Addresses requirements:
# - Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
# - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
output "redis_connection_string" {
  description = "Full Redis connection string including authentication credentials for secure application configuration"
  value       = data.upstash_redis_connection_string.redis_connection.uri
  sensitive   = true
}

# Redis cache instance ID output for resource tracking
# Addresses requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
output "redis_cache_id" {
  description = "Unique identifier of the Redis cache instance for resource tracking and reference"
  value       = upstash_redis_database.redis_cache.id
  sensitive   = false
}