/**
 * Human Tasks:
 * 1. Ensure environment variables are properly set in .env files for all configurations
 * 2. Update rate limit configurations based on actual subscription tier requirements
 * 3. Configure proper CORS origins for different environments
 * 4. Set appropriate JWT expiry times based on security requirements
 * 5. Review and adjust cache TTL values based on performance needs
 */

// Requirement: Type System (4.1 Programming Languages) - TypeScript 5.0+ for strong typing and enhanced IDE support
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  LOG_LEVEL: string;
}

// Requirement: System Configuration (5.2 Component Details) - Configuration interfaces for NextJS Edge Functions and backend services
export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  backupFrequency: string;
}

export interface CacheConfig {
  url: string;
  ttl: Record<string, number>;
  maxSize: number;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  priceIds: Record<string, string>;
}

export interface EmailConfig {
  apiKey: string;
  fromAddress: string;
  templates: Record<string, string>;
}

// Requirement: Security Configuration (8.1 Authentication and Authorization) - Type definitions for security and authentication configuration
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiry: number;
  refreshWindow: number;
  cookieName: string;
}

export interface RateLimitConfig {
  free: Record<string, number>;
  basic: Record<string, number>;
  premium: Record<string, number>;
}

export interface SecurityConfig {
  corsOrigins: string[];
  headers: Record<string, string>;
}

// Requirement: System Configuration (5.2 Component Details) - Root configuration interface combining all config sections
export interface AppConfig {
  env: EnvironmentConfig;
  db: DatabaseConfig;
  cache: CacheConfig;
  openai: OpenAIConfig;
  stripe: StripeConfig;
  email: EmailConfig;
  auth: AuthConfig;
  rateLimits: RateLimitConfig;
  security: SecurityConfig;
}