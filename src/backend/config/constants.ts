// @package zod ^3.22.0
import { DrillType, DrillDifficulty } from '../types/drills';
import { AppConfig } from '../types/config';

/**
 * Human Tasks:
 * 1. Set up environment variables for OpenAI API key and model configuration
 * 2. Configure proper CORS origins in environment variables for different deployment environments
 * 3. Review and adjust rate limits based on actual usage patterns and subscription tier requirements
 * 4. Ensure proper SSL certificates are in place for HSTS security header
 * 5. Configure Redis cache with appropriate memory allocation for TTL values
 */

// Requirement: System Configuration - Core API version
export const API_VERSION = 'v1';

// Requirement: System Configuration - Default pagination size
export const DEFAULT_PAGE_SIZE = 20;

// Requirement: System Configuration - Time limits for each drill type (in minutes)
export const DRILL_TIME_LIMITS: Record<DrillType, number> = {
  [DrillType.CASE_PROMPT]: 30,
  [DrillType.CALCULATION]: 15,
  [DrillType.CASE_MATH]: 20,
  [DrillType.BRAINSTORMING]: 25,
  [DrillType.MARKET_SIZING]: 25,
  [DrillType.SYNTHESIZING]: 35
};

// Requirement: Rate Limiting - API rate limits per subscription tier (requests per hour)
export const RATE_LIMITS: Record<string, Record<string, number>> = {
  free: {
    drills: 10,
    simulations: 2,
    evaluations: 5
  },
  basic: {
    drills: 50,
    simulations: 10,
    evaluations: 25
  },
  premium: {
    drills: 200,
    simulations: 50,
    evaluations: 100
  }
};

// Requirement: System Configuration - Cache TTL values in seconds
export const CACHE_TTL: Record<string, number> = {
  drill: 3600, // 1 hour
  user: 1800,  // 30 minutes
  simulation: 7200 // 2 hours
};

// Requirement: Security Controls - Security headers configuration
export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// Requirement: Security Controls - Authentication constants
export const AUTH_CONSTANTS: Record<string, any> = {
  TOKEN_EXPIRY: 3600, // 1 hour in seconds
  REFRESH_WINDOW: 86400, // 24 hours in seconds
  COOKIE_NAME: 'cip_session'
};

// Requirement: System Configuration - OpenAI API configuration
export const OPENAI_CONFIG: Record<string, any> = {
  MODEL: 'gpt-4',
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7
};

// Internal helper function to validate drill time limits
const validateDrillTimeLimits = (): boolean => {
  return Object.values(DRILL_TIME_LIMITS).every(time => 
    typeof time === 'number' && time > 0 && time <= 60
  );
};

// Validate configurations on initialization
(() => {
  if (!validateDrillTimeLimits()) {
    throw new Error('Invalid drill time limits configuration');
  }
  
  if (!Object.values(RATE_LIMITS).every(tier => 
    Object.values(tier).every(limit => typeof limit === 'number' && limit > 0)
  )) {
    throw new Error('Invalid rate limits configuration');
  }
  
  if (!Object.values(CACHE_TTL).every(ttl => 
    typeof ttl === 'number' && ttl > 0
  )) {
    throw new Error('Invalid cache TTL configuration');
  }
})();