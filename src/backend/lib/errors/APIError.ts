/**
 * Human Tasks:
 * 1. Configure request ID generation middleware for consistent error tracing
 * 2. Set up error monitoring and alerting for production environment
 * 3. Configure logging infrastructure to capture error context and stack traces
 * 4. Implement error reporting integration with error tracking service
 */

import { APIErrorCode } from '../../types/api';

/**
 * Custom error class for standardized API error handling across the application.
 * Implements the APIError interface for consistent error structure and serialization.
 * 
 * Requirement: Error Handling (7.3.5)
 * - Provides standardized error interface with codes, messages, and details
 * - Ensures consistent error reporting across all API endpoints
 * 
 * Requirement: API Layer (5.2)
 * - Supports standardized error handling for NextJS Edge Functions
 * - Used across drills, simulation, auth, and subscription endpoints
 */
export class APIError extends Error {
    public readonly code: APIErrorCode;
    public readonly message: string;
    public readonly details: Record<string, any>;
    public readonly timestamp: string;
    public readonly requestId: string;

    /**
     * Creates a new APIError instance with the specified error details.
     * 
     * @param code - The standardized error code from APIErrorCode enum
     * @param message - Human-readable error message
     * @param details - Additional error context as key-value pairs
     * @param requestId - Unique identifier for request tracing
     */
    constructor(
        code: APIErrorCode,
        message: string,
        details: Record<string, any> = {},
        requestId: string = 'unknown'
    ) {
        // Call parent Error constructor with message
        super(message);

        // Set error properties
        this.code = code;
        this.message = message;
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.requestId = requestId;

        // Set prototype explicitly for proper instanceof behavior
        Object.setPrototypeOf(this, APIError.prototype);
    }

    /**
     * Converts the error instance to a plain object for JSON serialization.
     * Ensures consistent error structure in API responses.
     * 
     * @returns Serializable error object matching APIError interface
     */
    public toJSON(): {
        code: APIErrorCode;
        message: string;
        details: Record<string, any>;
        timestamp: string;
        requestId: string;
    } {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
            requestId: this.requestId
        };
    }
}