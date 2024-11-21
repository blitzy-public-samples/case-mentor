// Internal imports
import { colors, breakpoints } from './theme';

/**
 * Human Tasks:
 * 1. Verify API base URL configuration for different environments
 * 2. Confirm rate limit thresholds with backend team
 * 3. Review subscription tier features with product team
 * 4. Validate error messages with UX team for clarity
 * 5. Test timeout and retry settings under different network conditions
 */

// Requirement: System Performance - API configuration settings
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.mckinsey-prep.com',
  TIMEOUT: 20000, // 20 seconds timeout
  RETRY_ATTEMPTS: 3, // Number of retry attempts for failed requests
  PERFORMANCE_THRESHOLD: 200 // Target response time in milliseconds
} as const;

// Requirement: Authentication & Authorization - JWT token configuration
export const AUTH_CONFIG = {
  TOKEN_EXPIRY: 3600, // 1 hour in seconds
  REFRESH_THRESHOLD: 300, // Refresh token 5 minutes before expiry
  SESSION_STORAGE_KEY: 'mckinsey_prep_session',
  REFRESH_TOKEN_KEY: 'mckinsey_prep_refresh'
} as const;

// Requirement: Core Features - Practice drill configuration
export const DRILL_CONFIG = {
  TIME_LIMITS: {
    CASE_PROMPT: 45 * 60, // 45 minutes in seconds
    CALCULATION: 15 * 60, // 15 minutes in seconds
    CASE_MATH: 20 * 60, // 20 minutes in seconds
    BRAINSTORMING: 30 * 60, // 30 minutes in seconds
    MARKET_SIZING: 25 * 60, // 25 minutes in seconds
    SYNTHESIZING: 40 * 60 // 40 minutes in seconds
  },
  ATTEMPT_LIMITS: {
    FREE: 3,
    BASIC: 10,
    PREMIUM: Infinity
  }
} as const;

// Requirement: Core Features - McKinsey simulation settings
export const SIMULATION_CONFIG = {
  MAX_SPECIES: 10, // Maximum number of species in ecosystem
  TIME_LIMIT: 60 * 60, // 60 minutes in seconds
  MIN_SPECIES: 3, // Minimum species for valid ecosystem
  ENVIRONMENT_UPDATE_INTERVAL: 5000, // 5 seconds between environment updates
  STABILITY_THRESHOLD: 0.7 // Minimum stability score for success
} as const;

// Requirement: Core Features - Subscription tier features
export const SUBSCRIPTION_TIERS = {
  FREE: {
    price: 0,
    drillAttempts: 3,
    simulationAttempts: 1,
    features: ['Basic drills', 'Limited simulation access', 'Community forum']
  },
  BASIC: {
    price: 29.99,
    drillAttempts: 10,
    simulationAttempts: 5,
    features: [
      'All drill types',
      'Extended simulation access',
      'Basic analytics',
      'Email support'
    ]
  },
  PREMIUM: {
    price: 99.99,
    drillAttempts: Infinity,
    simulationAttempts: Infinity,
    features: [
      'Unlimited drills',
      'Full simulation access',
      'Advanced analytics',
      'Priority support',
      'Custom study plan',
      'Mock interviews'
    ]
  }
} as const;

// Requirement: Rate Limiting - API request quotas per subscription tier
export const RATE_LIMITS = {
  FREE: {
    requests: 100, // Requests per hour
    concurrent: 2, // Concurrent requests
    burst: 10 // Burst requests per minute
  },
  BASIC: {
    requests: 500,
    concurrent: 5,
    burst: 25
  },
  PREMIUM: {
    requests: 2000,
    concurrent: 10,
    burst: 50
  }
} as const;

// Requirement: System Performance - Standardized error messages
export const ERROR_MESSAGES = {
  API: {
    TIMEOUT: 'Request timed out. Please try again.',
    RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
    NETWORK: 'Network error. Please check your connection.',
    SERVER: 'Server error. Our team has been notified.'
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    UNAUTHORIZED: 'You do not have access to this resource.',
    TOKEN_ERROR: 'Authentication error. Please log in again.'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PASSWORD: 'Password must be at least 8 characters long.',
    INVALID_INPUT: 'Please check your input and try again.'
  }
} as const;

// Performance thresholds for monitoring and alerts
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE: 200, // milliseconds
  RENDER_TIME: 100, // milliseconds
  LOAD_TIME: 1500, // milliseconds
  MEMORY_USAGE: 90 // percentage
} as const;

// Cache configuration for API responses
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5 minutes in seconds
  MAX_ITEMS: 1000,
  STORAGE_PREFIX: 'mckinsey_prep_cache_'
} as const;