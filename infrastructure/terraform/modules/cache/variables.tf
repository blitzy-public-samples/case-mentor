# Human Tasks:
# 1. Review and adjust Redis memory size defaults based on actual load testing results
# 2. Validate maintenance window aligns with lowest platform usage periods
# 3. Confirm backup frequency meets data recovery requirements
# 4. Adjust max connections based on concurrent user benchmarks

# Addresses requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
# Defines core configuration variables for Redis cache deployment

# Environment variable to determine deployment context
variable "environment" {
  description = "Deployment environment (development, staging, production) for the Redis cache instance"
  type        = string

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production"
  }
}

# Redis version configuration
# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
variable "redis_version" {
  description = "Redis version to use for the cache instance, must be compatible with Upstash provider"
  type        = string
  default     = "6.2"

  validation {
    condition     = can(regex("^[0-9]+(\\.[0-9]+)*$", var.redis_version))
    error_message = "Redis version must be a valid semantic version number"
  }
}

# Memory allocation configuration
# Addresses requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
variable "redis_memory_size" {
  description = "Memory size in MB for the Redis cache instance, scaled based on environment and load requirements"
  type        = number
  default     = 2048

  validation {
    condition     = var.redis_memory_size >= 512 && var.redis_memory_size <= 8192
    error_message = "Redis memory size must be between 512MB and 8192MB to maintain performance"
  }
}

# Cache eviction policy configuration
# Addresses requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
variable "redis_eviction_policy" {
  description = "Eviction policy for Redis cache when memory limit is reached, optimized for the platform's caching patterns"
  type        = string
  default     = "volatile-lru"

  validation {
    condition     = contains(["noeviction", "allkeys-lru", "volatile-lru", "allkeys-random", "volatile-random", "volatile-ttl"], var.redis_eviction_policy)
    error_message = "Invalid Redis eviction policy specified"
  }
}

# Connection limits configuration
# Addresses requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
variable "redis_max_connections" {
  description = "Maximum number of concurrent connections to Redis cache, scaled based on expected platform load"
  type        = number
  default     = 100

  validation {
    condition     = var.redis_max_connections >= 10 && var.redis_max_connections <= 1000
    error_message = "Redis max connections must be between 10 and 1000 to prevent overload"
  }
}

# API cache TTL configuration
# Addresses requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
variable "api_cache_ttl" {
  description = "TTL in seconds for API response cache entries, optimized for data freshness and performance"
  type        = number
  default     = 300

  validation {
    condition     = var.api_cache_ttl >= 60 && var.api_cache_ttl <= 3600
    error_message = "API cache TTL must be between 60 and 3600 seconds for optimal performance"
  }
}

# Session cache TTL configuration
# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
variable "session_cache_ttl" {
  description = "TTL in seconds for session data cache entries, aligned with platform security requirements"
  type        = number
  default     = 86400

  validation {
    condition     = var.session_cache_ttl >= 3600 && var.session_cache_ttl <= 604800
    error_message = "Session cache TTL must be between 1 hour and 7 days for security compliance"
  }
}

# Drill cache TTL configuration
# Addresses requirement: Caching Strategy (4.3 DATABASES & STORAGE/Caching Strategy (Redis))
variable "drill_cache_ttl" {
  description = "TTL in seconds for drill data cache entries, balanced for data persistence and memory usage"
  type        = number
  default     = 3600

  validation {
    condition     = var.drill_cache_ttl >= 300 && var.drill_cache_ttl <= 86400
    error_message = "Drill cache TTL must be between 5 minutes and 24 hours for optimal performance"
  }
}

# Backup configuration
# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
variable "redis_backup_frequency" {
  description = "Frequency of Redis cache backups (hourly, daily, weekly)"
  type        = string
  default     = "daily"

  validation {
    condition     = contains(["hourly", "daily", "weekly"], var.redis_backup_frequency)
    error_message = "Backup frequency must be one of: hourly, daily, weekly"
  }
}

# Maintenance window configuration
# Addresses requirement: Platform Stability (2. SYSTEM OVERVIEW/Success Criteria)
variable "redis_maintenance_window" {
  description = "Preferred maintenance window for Redis cache updates in UTC (format: ddd:hh:mm-ddd:hh:mm)"
  type        = string
  default     = "sun:03:00-sun:04:00"

  validation {
    condition     = can(regex("^(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]-(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]$", var.redis_maintenance_window))
    error_message = "Maintenance window must be in format ddd:hh:mm-ddd:hh:mm"
  }
}