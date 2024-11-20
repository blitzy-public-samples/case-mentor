# Case Interview Practice Platform - Infrastructure

This document provides comprehensive documentation for the infrastructure setup and deployment of the Case Interview Practice Platform using Terraform. The infrastructure is designed to manage cloud resources across Vercel, Supabase, and Redis services.

## Prerequisites

Before beginning infrastructure deployment, ensure you have the following:

### Required Tools
- Terraform (~> 1.5.0)
- Vercel CLI (latest version)
- Supabase CLI (latest version)

### Service Accounts and Access Tokens
1. Vercel
   - API Token with deployment permissions
   - Team ID (for organization deployments)

2. Supabase
   - Access Token
   - Project Reference ID
   - Database Password

3. Upstash (Redis)
   - API Key
   - Account Email

## Getting Started

1. Configure environment variables for sensitive credentials:
```bash
export TF_VAR_vercel_api_token=<your_vercel_token>
export TF_VAR_supabase_access_token=<your_supabase_token>
export TF_VAR_upstash_api_key=<your_upstash_key>
```

2. Initialize Terraform workspace:
```bash
terraform init
terraform workspace select <environment>  # development, staging, or production
```

## Project Structure

The infrastructure configuration is organized as follows:

```
infrastructure/terraform/
├── main.tf           # Core resource configurations
├── variables.tf      # Variable definitions and validation
├── providers.tf      # Provider configurations
├── versions.tf       # Version constraints
└── modules/
    ├── database/     # Supabase database configuration
    ├── cache/        # Redis cache configuration
    └── storage/      # Storage configuration
```

## Module Documentation

### Database Module (Supabase)
- **Purpose**: Manages PostgreSQL database instance and authentication services
- **Configuration**:
  - Instance Size: `db-4cpu-8gb` (default)
  - Max Connections: 100
  - Auto-backup enabled

### Cache Module (Redis)
- **Purpose**: Handles session management and data caching
- **Configuration**:
  - Instance Size: `cache.t3.medium` (default)
  - Default TTL: 3600 seconds
  - High availability enabled

### Storage Module
- **Purpose**: Manages asset storage and CDN distribution
- **Configuration**:
  - Bucket Name: `case-interview-assets`
  - Public access configured per environment
  - Versioning enabled

## Environment Configuration

### Development
```bash
terraform workspace select development
```
- Smaller instance sizes for cost optimization
- Debug logging enabled
- Relaxed security rules for development

### Staging
```bash
terraform workspace select staging
```
- Production-like configuration
- Test data isolation
- Monitoring enabled

### Production
```bash
terraform workspace select production
```
- Maximum performance configuration
- Enhanced security rules
- Full monitoring and alerting
- Automated backups

## Deployment Guide

1. Review and prepare environment-specific variables:
```bash
terraform plan -var-file="environments/${environment}.tfvars"
```

2. Apply the infrastructure changes:
```bash
terraform apply -var-file="environments/${environment}.tfvars"
```

3. Verify deployment outputs:
- Vercel Deployment URL
- Supabase API URL
- Redis Connection URL

## Security

### Sensitive Variable Management
- All sensitive variables are marked with `sensitive = true`
- Use environment variables or encrypted tfvars files
- Never commit credentials to version control

### Access Control
- Implement least-privilege access
- Regular credential rotation
- Audit logging enabled

### Environment Isolation
- Separate workspaces per environment
- Network isolation between environments
- Environment-specific security rules

## Maintenance

### Routine Tasks
1. Regular state backup
2. Infrastructure version updates
3. Security patch application
4. Performance monitoring

### Troubleshooting
1. Check Terraform logs: `TF_LOG=DEBUG terraform plan`
2. Verify provider status
3. Review resource metrics
4. Consult service status pages

### Scaling Guidelines
- Monitor resource utilization
- Adjust instance sizes as needed
- Review and optimize costs
- Scale horizontally when possible

### Backup and Recovery
- Automated database backups
- State file versioning
- Disaster recovery procedures
- Regular recovery testing

For additional details about the infrastructure architecture and design decisions, refer to the technical specification document in the project repository.