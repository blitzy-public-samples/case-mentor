// @ts-check

/**
 * Human Tasks:
 * 1. Verify rate limit values with product team for each subscription tier
 * 2. Ensure error codes align with backend implementation
 * 3. Configure proper date serialization format for timestamps
 * 4. Set up monitoring for API response times to meet 200ms requirement
 */

// Internal imports
import { DrillAttempt } from './drills';
import { SimulationResult } from './simulation';

// Requirement: System Performance - API response time monitoring and error handling
export interface APIResponse<T> {
  // Indicates if the request was successful
  success: boolean;
  // Generic data payload
  data: T;
  // Structured error information if success is false
  error: APIError | null;
  // ISO 8601 timestamp for request tracking
  timestamp: string;
  // Unique identifier for request tracing
  requestId: string;
}

// Requirement: System Performance - Standardized error handling structure
export interface APIError {
  // Categorized error code for client handling
  code: ErrorCode;
  // Human-readable error message
  message: string;
  // Additional error context and metadata
  details: Record<string, any>;
}

// Requirement: System Performance - Error classification
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Requirement: Rate Limiting - Tier-based rate limiting information
export interface RateLimitInfo {
  // Maximum requests allowed in the current window
  limit: number;
  // Remaining requests in the current window
  remaining: number;
  // Timestamp when the rate limit resets (Unix timestamp)
  reset: number;
}

// Requirement: System Performance - Generic paginated response structure
export interface PaginatedResponse<T> {
  // Array of items for the current page
  data: T[];
  // Total number of items across all pages
  total: number;
  // Current page number (1-based)
  page: number;
  // Number of items per page
  pageSize: number;
  // Indicates if there are more pages available
  hasMore: boolean;
}

// Requirement: System Performance - Type alias for drill-related API responses
export type DrillResponse = APIResponse<DrillAttempt>;

// Requirement: System Performance - Type alias for simulation-related API responses
export type SimulationResponse = APIResponse<SimulationResult>;