// @package next ^13.0.0
// @package zod ^3.22.0

/**
 * Human Tasks:
 * 1. Configure error monitoring service integration (e.g., Sentry) for production error tracking
 * 2. Set up logging infrastructure to capture error context and stack traces
 * 3. Configure rate limiting middleware with Redis for distributed rate limiting
 * 4. Implement request ID generation and propagation middleware
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { APIError } from './APIError';
import { APIErrorCode, APIResponse } from '../../types/api';

/**
 * Global error handler that converts various error types into standardized APIError responses.
 * 
 * Requirement: Error Handling (7.3.5)
 * - Provides consistent error responses with proper status codes and details
 * - Standardizes error handling across all API endpoints
 * 
 * Requirement: API Layer (5.2)
 * - Ensures <200ms response time for error handling in Edge Functions
 * - Includes request tracing for error monitoring
 */
export function handleError(error: Error, requestId: string): NextResponse<APIResponse<null>> {
    let apiError: APIError;
    let statusCode: number;

    // Handle known error types
    if (error instanceof APIError) {
        apiError = error;
        statusCode = getStatusCodeForError(error.code);
    } else if (error instanceof ZodError) {
        const response = handleValidationError(error, requestId);
        return response;
    } else if (error.name === 'AuthError' || error.name === 'UnauthorizedError') {
        const response = handleAuthError(error, requestId);
        return response;
    } else if (error.name === 'RateLimitError') {
        const response = handleRateLimitError(error, requestId);
        return response;
    } else {
        // Handle unknown errors as internal server errors
        apiError = new APIError(
            APIErrorCode.INTERNAL_ERROR,
            'An unexpected error occurred',
            {
                originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            requestId
        );
        statusCode = 500;
    }

    // Construct standardized error response
    const response: APIResponse<null> = {
        success: false,
        data: null,
        error: apiError.toJSON(),
        metadata: {}
    };

    return NextResponse.json(response, { status: statusCode });
}

/**
 * Handles validation errors from Zod schema validation.
 * 
 * Requirement: Error Handling (7.3.5)
 * - Provides field-level validation error details
 * - Returns consistent 400 status code for validation failures
 */
export function handleValidationError(error: ZodError, requestId: string): NextResponse<APIResponse<null>> {
    // Format validation issues by field path
    const fieldErrors: Record<string, string[]> = {};
    error.errors.forEach((issue) => {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
            fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
    });

    const apiError = new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Validation failed',
        {
            fields: fieldErrors
        },
        requestId
    );

    const response: APIResponse<null> = {
        success: false,
        data: null,
        error: apiError.toJSON(),
        metadata: {}
    };

    return NextResponse.json(response, { status: 400 });
}

/**
 * Handles authentication and authorization errors.
 * 
 * Requirement: Error Handling (7.3.5)
 * - Distinguishes between authentication and authorization failures
 * - Returns appropriate 401/403 status codes
 */
export function handleAuthError(error: Error, requestId: string): NextResponse<APIResponse<null>> {
    const isAuthenticationError = error.name === 'AuthError';
    const errorCode = isAuthenticationError ? 
        APIErrorCode.AUTHENTICATION_ERROR : 
        APIErrorCode.AUTHORIZATION_ERROR;
    
    const statusCode = isAuthenticationError ? 401 : 403;
    
    const apiError = new APIError(
        errorCode,
        error.message || (isAuthenticationError ? 
            'Authentication required' : 
            'Insufficient permissions'),
        {},
        requestId
    );

    const response: APIResponse<null> = {
        success: false,
        data: null,
        error: apiError.toJSON(),
        metadata: {}
    };

    return NextResponse.json(response, { status: statusCode });
}

/**
 * Handles rate limit exceeded errors.
 * 
 * Requirement: Error Handling (7.3.5)
 * - Includes retry-after information in response
 * - Returns standard 429 status code
 */
export function handleRateLimitError(error: Error, requestId: string): NextResponse<APIResponse<null>> {
    // Extract retry-after information from error if available
    const retryAfter = (error as any).retryAfter || 60; // Default to 60 seconds

    const apiError = new APIError(
        APIErrorCode.RATE_LIMIT_ERROR,
        'Rate limit exceeded',
        {
            retryAfter,
            retryAt: new Date(Date.now() + (retryAfter * 1000)).toISOString()
        },
        requestId
    );

    const response: APIResponse<null> = {
        success: false,
        data: null,
        error: apiError.toJSON(),
        metadata: {}
    };

    return NextResponse.json(response, { 
        status: 429,
        headers: {
            'Retry-After': retryAfter.toString()
        }
    });
}

/**
 * Maps APIErrorCode to HTTP status codes.
 */
function getStatusCodeForError(code: APIErrorCode): number {
    switch (code) {
        case APIErrorCode.VALIDATION_ERROR:
            return 400;
        case APIErrorCode.AUTHENTICATION_ERROR:
            return 401;
        case APIErrorCode.AUTHORIZATION_ERROR:
            return 403;
        case APIErrorCode.NOT_FOUND:
            return 404;
        case APIErrorCode.RATE_LIMIT_ERROR:
            return 429;
        case APIErrorCode.INTERNAL_ERROR:
        default:
            return 500;
    }
}