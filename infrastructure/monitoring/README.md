# Monitoring Infrastructure Documentation

## Overview
This document outlines the monitoring infrastructure setup for the Case Interview Practice Platform using Grafana 9.5.0 and Prometheus 2.45.0. The monitoring stack provides comprehensive observability, performance tracking, and alerting capabilities.

## Components

### Grafana (v9.5.0)
- Primary visualization platform for metrics and dashboards
- Configured with Prometheus datasource for metrics collection
- Custom dashboards for API performance monitoring
- Alert visualization and management interface

### Prometheus (v2.45.0)
- Core metrics collection and storage system
- Configured scrape targets:
  - Edge Functions (api.caseprep.vercel.app)
  - Supabase Database (db.caseprep.supabase.co)
  - Redis Cache
- Alert rules for performance and stability monitoring
- 15-day metrics retention with 50GB storage limit

## Setup Instructions

### 1. Prometheus Setup
```yaml
# prometheus.yml configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s

scrape_configs:
  - job_name: 'edge-functions'
    metrics_path: '/metrics'
    scheme: 'https'
    static_configs:
      - targets: ['api.caseprep.vercel.app']
```

### 2. Grafana Setup
```yaml
# datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

### 3. Alert Rules Setup
```yaml
groups:
  - name: api_alerts
    rules:
      - alert: HighLatency
        expr: job:http_request_duration_seconds:p95 > 0.2
        for: 5m
        labels:
          severity: critical
```

## Dashboard Guide

### API Performance Dashboard
- **Response Time Distribution**: 95th percentile latency tracking with 200ms threshold
- **Request Rate**: Traffic volume by status code
- **Error Rate**: Platform stability monitoring with 99.9% uptime target
- **Endpoint Latency**: Heatmap visualization of endpoint performance

Key Features:
- Real-time metrics updates (10s refresh)
- Deployment annotations
- Configurable time ranges
- Multi-endpoint filtering

## Alerting Rules

### Performance Alerts
- High Latency (>200ms for 95th percentile)
- Low Cache Hit Rate (<70%)
- High Memory Usage (>85%)

### Stability Alerts
- High Error Rate (>5%)
- Low Uptime (<99.9%)
- External Service Availability

### Business KPI Alerts
- Low Drill Completion Rate (<80%)

## Maintenance

### Daily Tasks
1. Monitor alert status and resolve any triggered alerts
2. Verify metrics collection from all scrape targets
3. Check Prometheus storage consumption

### Weekly Tasks
1. Review dashboard performance and optimize queries
2. Validate alert thresholds and rules
3. Check recording rules efficiency

### Monthly Tasks
1. Audit metric retention and storage usage
2. Review and update alert configurations
3. Validate SLO compliance
4. Update documentation for any configuration changes

### Troubleshooting

#### Metrics Collection Issues
1. Verify target accessibility
2. Check scrape job configurations
3. Validate metrics endpoint authentication
4. Review Prometheus logs

#### Dashboard Issues
1. Verify Prometheus datasource connectivity
2. Check query performance
3. Validate panel configurations
4. Review browser console for errors

#### Alert Issues
1. Verify alertmanager service
2. Check alert rule syntax
3. Validate notification channels
4. Review alert history

## Prerequisites
- Docker and Docker Compose for containerized deployment
- Network access to all monitoring targets
- Sufficient storage for metrics retention
- Required authentication credentials
- Firewall rules for metrics collection

## Security Considerations
- Secure metrics endpoints with authentication
- Configure network security groups
- Regular security updates for monitoring stack
- Audit access controls and permissions
- Protect sensitive metrics data

## Related Documentation
- [Grafana Documentation](https://grafana.com/docs/grafana/v9.5/)
- [Prometheus Documentation](https://prometheus.io/docs/prometheus/2.45/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)