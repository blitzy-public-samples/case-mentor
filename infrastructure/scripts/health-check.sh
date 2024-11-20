#!/bin/bash

# HUMAN TASKS:
# 1. Verify network connectivity to all endpoints (api.caseprep.vercel.app, db.caseprep.supabase.co, redis)
# 2. Ensure required tools curl v7.0+ and jq v1.6+ are installed
# 3. Set up appropriate firewall rules to allow health check requests
# 4. Configure authentication credentials for database and external services
# 5. Verify script has execution permissions (chmod +x health-check.sh)

# Required tool versions:
# - curl v7.0+
# - jq v1.6+

set -euo pipefail

# Constants from Prometheus alert rules
readonly API_LATENCY_THRESHOLD=0.2  # 200ms (HighLatency)
readonly ERROR_RATE_THRESHOLD=0.05  # 5% (HighErrorRate)
readonly MEMORY_USAGE_THRESHOLD=0.85  # 85% (HighMemoryUsage)
readonly CACHE_HIT_THRESHOLD=0.7  # 70% (LowCacheHitRate)
readonly EXTERNAL_SERVICE_TIMEOUT=300  # 5 minutes (ExternalServiceDown)

# Endpoints from prometheus.yml
readonly API_ENDPOINT="https://api.caseprep.vercel.app"
readonly DB_ENDPOINT="db.caseprep.supabase.co:9090"
readonly REDIS_ENDPOINT="redis:9121"
readonly EXTERNAL_SERVICES=(
    "https://api.openai.com/v1/health"
    "https://api.stripe.com/v1/health"
    "https://api.resend.com/health"
)

# Requirement: System Performance - Verify API response times are <200ms
check_api_health() {
    local endpoint_url="$1"
    local start_time
    local end_time
    local response_time
    local http_code
    
    echo "Checking API health at $endpoint_url..."
    
    start_time=$(date +%s.%N)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
                    --connect-timeout 10 \
                    --max-time 10 \
                    "${endpoint_url}/health")
    end_time=$(date +%s.%N)
    
    response_time=$(echo "$end_time - $start_time" | bc)
    
    if [[ "$http_code" != "200" ]]; then
        echo "API health check failed with status code: $http_code"
        return 1
    fi
    
    if (( $(echo "$response_time > $API_LATENCY_THRESHOLD" | bc -l) )); then
        echo "API response time ($response_time s) exceeds threshold ($API_LATENCY_THRESHOLD s)"
        return 1
    fi
    
    echo "API health check passed"
    return 0
}

# Requirement: Platform Stability - Monitor platform uptime
check_database_health() {
    local database_url="$1"
    local start_time
    local response
    
    echo "Checking database health at $database_url..."
    
    response=$(curl -s --connect-timeout 10 \
                   --max-time 10 \
                   "http://${database_url}/health")
    
    if ! echo "$response" | jq -e '.healthy' >/dev/null; then
        echo "Database health check failed"
        return 1
    fi
    
    # Check replication lag if applicable
    local lag
    lag=$(echo "$response" | jq -r '.replication_lag // 0')
    if [[ "$lag" -gt 300 ]]; then
        echo "Database replication lag ($lag seconds) is too high"
        return 1
    fi
    
    echo "Database health check passed"
    return 0
}

# Requirement: Monitoring & Observability - Implement cache health checks
check_cache_health() {
    local redis_url="$1"
    local response
    local memory_usage
    local hit_rate
    
    echo "Checking Redis cache health at $redis_url..."
    
    response=$(curl -s --connect-timeout 5 \
                   --max-time 5 \
                   "http://${redis_url}/metrics")
    
    # Extract memory usage and hit rate from metrics
    memory_usage=$(echo "$response" | grep 'used_memory_rss' | awk '{print $2}')
    hit_rate=$(echo "$response" | grep 'keyspace_hits' | awk '{print $2}')
    
    if [[ -z "$memory_usage" || -z "$hit_rate" ]]; then
        echo "Failed to retrieve Redis metrics"
        return 1
    fi
    
    # Check memory usage threshold
    if (( $(echo "$memory_usage > $MEMORY_USAGE_THRESHOLD" | bc -l) )); then
        echo "Redis memory usage ($memory_usage) exceeds threshold ($MEMORY_USAGE_THRESHOLD)"
        return 1
    fi
    
    # Check cache hit rate threshold
    if (( $(echo "$hit_rate < $CACHE_HIT_THRESHOLD" | bc -l) )); then
        echo "Redis hit rate ($hit_rate) below threshold ($CACHE_HIT_THRESHOLD)"
        return 1
    }
    
    echo "Cache health check passed"
    return 0
}

# Requirement: Monitoring & Observability - Check external service dependencies
check_external_services() {
    local -a service_endpoints=("$@")
    local failed_services=0
    
    echo "Checking external service health..."
    
    for endpoint in "${service_endpoints[@]}"; do
        local start_time
        start_time=$(date +%s)
        
        if ! curl -s --connect-timeout 10 \
                    --max-time 10 \
                    -o /dev/null \
                    -w "%{http_code}" \
                    "$endpoint" | grep -q "^2"; then
            echo "External service $endpoint is unhealthy"
            failed_services=$((failed_services + 1))
            
            # Check if service has been down for more than 5 minutes
            local down_time
            down_time=$(($(date +%s) - start_time))
            if [[ "$down_time" -gt "$EXTERNAL_SERVICE_TIMEOUT" ]]; then
                return 1
            fi
        fi
    done
    
    if [[ "$failed_services" -eq 0 ]]; then
        echo "All external services are healthy"
        return 0
    fi
    return 1
}

# Main health check orchestrator
main() {
    local exit_code=0
    local failed_checks=()
    
    echo "Starting system health checks..."
    
    # Check API health
    if ! check_api_health "$API_ENDPOINT"; then
        failed_checks+=("API")
        exit_code=1
    fi
    
    # Check database health
    if ! check_database_health "$DB_ENDPOINT"; then
        failed_checks+=("Database")
        exit_code=1
    fi
    
    # Check cache health
    if ! check_cache_health "$REDIS_ENDPOINT"; then
        failed_checks+=("Cache")
        exit_code=1
    fi
    
    # Check external services
    if ! check_external_services "${EXTERNAL_SERVICES[@]}"; then
        failed_checks+=("External Services")
        exit_code=1
    fi
    
    echo "Health check summary:"
    if [[ "${#failed_checks[@]}" -eq 0 ]]; then
        echo "✅ All systems healthy"
    else
        echo "❌ Failed checks: ${failed_checks[*]}"
    fi
    
    return "$exit_code"
}

# Execute main function
main "$@"