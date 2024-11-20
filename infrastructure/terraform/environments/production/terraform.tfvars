# Addresses requirement: Production Environment Configuration (9.1 DEPLOYMENT ENVIRONMENT/Environment Distribution)
# Defines production-specific infrastructure variables for global deployment with high availability and redundancy
project_name = "case-interview-platform-prod"
environment  = "production"

# Addresses requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
# Configures high-performance database instance to support <200ms API response time
database_instance_size = "db-8cpu-16gb"

# Configures Redis cache instance for optimal caching performance
redis_instance_size = "cache.t3.large"
redis_ttl = 3600

# Addresses requirement: Data Security (8.2 DATA SECURITY/8.2.1 Data Classification)
# Configures secure storage bucket for production assets
storage_bucket_name = "case-interview-assets-prod"