# Human Tasks:
# 1. Verify Redis memory size aligns with actual application usage patterns
# 2. Monitor connection limits during peak usage periods
# 3. Review and adjust cache TTLs based on production metrics
# 4. Ensure backup retention period meets compliance requirements

# Addresses requirement: Infrastructure Management (5.1 High-Level Architecture)
# Configures Redis cache infrastructure using Upstash for global availability

# Configure required providers
# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
terraform {
  required_providers {
    upstash = {
      source  = "upstash/upstash"  # Version ~> 1.0
      version = "~> 1.0"
    }
  }
}

# Redis cache instance resource
# Addresses requirements:
# - Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
# - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
resource "upstash_redis_database" "redis_cache" {
  # Database name with environment prefix for clear identification
  database_name = "${var.environment}-case-interview-cache"
  
  # Global region deployment for low-latency access
  # Addresses requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
  region = "global"
  
  # Redis version configuration
  version = var.redis_version
  
  # Memory allocation with configurable size
  # Addresses requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
  memory_size = var.redis_memory_size
  
  # Cache eviction policy for memory management
  # Addresses requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
  eviction_policy = var.redis_eviction_policy
  
  # Connection limits for scalability
  # Addresses requirement: Infrastructure Scaling (5.2 Component Details/Database Layer)
  max_connections = var.redis_max_connections
  
  # Enable TLS for secure connections
  tls_enabled = true
  
  # Resource tagging for organization and cost allocation
  tags = {
    Environment = var.environment
    Project     = "case-interview-platform"
  }
}

# Redis connection string data source
# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
data "upstash_redis_connection_string" "redis_connection" {
  # Reference to the created Redis database
  database_id = upstash_redis_database.redis_cache.id
}

# Output block for Redis host details
output "redis_host" {
  description = "Redis cache instance hostname"
  value       = upstash_redis_database.redis_cache.host
  sensitive   = true
}

# Output block for Redis port
output "redis_port" {
  description = "Redis cache instance port number"
  value       = upstash_redis_database.redis_cache.port
}

# Output block for Redis connection URI
output "redis_connection_string" {
  description = "Secure Redis connection string for application configuration"
  value       = data.upstash_redis_connection_string.redis_connection.uri
  sensitive   = true
}

# Output block for Redis database ID
output "redis_database_id" {
  description = "Redis cache instance identifier"
  value       = upstash_redis_database.redis_cache.id
}