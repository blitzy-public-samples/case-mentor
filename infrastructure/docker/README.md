# Docker Infrastructure Documentation

## Overview

This documentation covers the Docker-based infrastructure components of the Case Interview Practice Platform, consisting of:

1. Development Environment - Local setup with PostgreSQL (Supabase), Redis, and MailHog
2. Monitoring Stack - Production monitoring with Prometheus, Grafana, and AlertManager

## Development Environment

### Prerequisites

- Docker Engine 20.10.0+
- Docker Compose 3.8+
- Minimum 4GB RAM
- 10GB free disk space

### Configuration

1. Navigate to the development environment directory:
```bash
cd infrastructure/docker/development
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Configure the following variables in `.env`:
- `POSTGRES_PASSWORD`: Secure password for PostgreSQL
- `POSTGRES_USER`: Database username (default: postgres)
- `POSTGRES_DB`: Database name (default: case_interview_platform)
- `REDIS_PASSWORD`: Secure password for Redis
- `REDIS_MAX_MEMORY`: Redis memory limit (default: 2gb)
- `MAILHOG_SMTP_PORT`: SMTP port (default: 1025)
- `MAILHOG_UI_PORT`: Web UI port (default: 8025)

### Starting Services

Launch the development environment:
```bash
docker-compose up -d
```

### Accessing Services

- PostgreSQL (Supabase)
  - Host: localhost
  - Port: 5432
  - Version: 14.1.0
  - Connection string: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}`

- Redis Cache
  - Host: localhost
  - Port: 6379
  - Version: 6-alpine
  - Connection: `redis://localhost:6379`

- MailHog
  - SMTP: localhost:1025
  - Web UI: http://localhost:8025
  - Version: latest

### Troubleshooting

1. Service Health Checks
```bash
docker-compose ps
docker-compose logs [service_name]
```

2. Common Issues:
- Port conflicts: Ensure ports 5432, 6379, 1025, and 8025 are available
- Memory issues: Adjust Redis memory limit in .env
- Database connection: Verify PostgreSQL credentials and network connectivity

## Monitoring Stack

### Components

1. Prometheus (v2.45.0)
   - Metrics collection and storage
   - Port: 9090
   - Retention: 15 days
   - Storage: 50GB minimum

2. Grafana (v9.5.0)
   - Metrics visualization and dashboards
   - Port: 3000
   - Default plugins: grafana-piechart-panel

3. AlertManager (v0.25.0)
   - Alert handling and notifications
   - Port: 9093

### Configuration

1. Navigate to monitoring directory:
```bash
cd infrastructure/docker/monitoring
```

2. Configure data directories:
```bash
sudo mkdir -p /data/{prometheus,grafana,alertmanager}
sudo chown -R nobody:nogroup /data/prometheus /data/alertmanager
sudo chown -R 472:472 /data/grafana
```

3. Set Grafana admin password:
```bash
export GRAFANA_ADMIN_PASSWORD=your-secure-password
```

### Deployment

Start monitoring stack:
```bash
docker-compose up -d
```

### Dashboard Access

- Prometheus: http://localhost:9090
  - Metrics exploration
  - PromQL query interface
  - Targets and alerts status

- Grafana: http://localhost:3000
  - Default login: admin
  - Password: ${GRAFANA_ADMIN_PASSWORD}
  - Pre-configured dashboards:
    - API Performance
    - System Health
    - Platform Stability

- AlertManager: http://localhost:9093
  - Alert status and history
  - Silences configuration
  - Notification routing

### Alert Configuration

Alerts are configured for:
- API response times > 200ms (95th percentile)
- Error rates > 5%
- Platform uptime < 99.9%
- Resource utilization > 85%
- Cache hit rates < 70%
- External service availability

Alert notifications can be configured through AlertManager for:
- Email
- Slack
- PagerDuty
- Custom webhooks

## Security Considerations

1. Network Security
   - Development and monitoring networks are isolated
   - Internal services not exposed by default
   - TLS/SSL recommended for production

2. Access Control
   - Strong passwords required for all services
   - Default credentials must be changed
   - Principle of least privilege applied

3. Resource Limits
   - Container memory limits enforced
   - Storage quotas configured
   - CPU shares allocated fairly

## Maintenance

1. Backup Procedures
   - PostgreSQL data: /data/postgres
   - Redis data: /data/redis
   - Prometheus metrics: /data/prometheus
   - Grafana dashboards: /data/grafana

2. Log Management
   - Container logs accessible via docker-compose logs
   - Log rotation configured
   - Monitoring metrics retained for 15 days

3. Updates
   - Check for security updates regularly
   - Test updates in development first
   - Maintain version compatibility