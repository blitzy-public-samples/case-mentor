// @package zod ^3.22.0
import { z } from 'zod';
import { DrillType } from './drills';
import { SimulationStatus } from './simulation';

/**
 * Human Tasks:
 * 1. Configure API rate limiting middleware with Redis for distributed rate limiting
 * 2. Set up request ID generation and tracking for API monitoring
 * 3. Implement API metrics collection for response time monitoring
 * 4. Configure proper CORS settings for API endpoints
 * 5. Set up API documentation generation using OpenAPI/Swagger
 */

// Requirement: API Design - Standardized HTTP methods
export enum HTTPMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH'
}

// Requirement: API Design - Standardized error codes
export enum APIErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Requirement: API Design - Standardized error response structure
export interface APIError {
    code: APIErrorCode;
    message: string;
    details: Record<string, any>;
    timestamp: string;
    requestId: string;
}

// Requirement: API Design - Generic response wrapper
export interface APIResponse<T> {
    success: boolean;
    data: T;
    error: APIError | null;
    metadata: Record<string, any>;
}

// Requirement: System Performance - Pagination parameters
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

// Requirement: System Performance - Paginated response structure
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
}

// Requirement: Security Controls - Rate limiting information
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}

// Zod schemas for runtime validation

export const APIErrorSchema = z.object({
    code: z.nativeEnum(APIErrorCode),
    message: z.string(),
    details: z.record(z.any()),
    timestamp: z.string().datetime(),
    requestId: z.string().uuid()
});

export const APIResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema,
        error: APIErrorSchema.nullable(),
        metadata: z.record(z.any())
    });

export const PaginationParamsSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    sortBy: z.string(),
    sortOrder: z.enum(['asc', 'desc'])
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        total: z.number().int().min(0),
        page: z.number().int().min(1),
        totalPages: z.number().int().min(0),
        hasMore: z.boolean()
    });

export const RateLimitInfoSchema = z.object({
    limit: z.number().int().positive(),
    remaining: z.number().int().min(0),
    reset: z.number().int().positive()
});

// Type guards for runtime type checking
export const isAPIError = (value: unknown): value is APIError => {
    return APIErrorSchema.safeParse(value).success;
};

export const isAPIResponse = <T extends z.ZodType>(
    value: unknown,
    dataSchema: T
): value is APIResponse<z.infer<T>> => {
    return APIResponseSchema(dataSchema).safeParse(value).success;
};

export const isPaginationParams = (value: unknown): value is PaginationParams => {
    return PaginationParamsSchema.safeParse(value).success;
};

export const isPaginatedResponse = <T extends z.ZodType>(
    value: unknown,
    itemSchema: T
): value is PaginatedResponse<z.infer<T>> => {
    return PaginatedResponseSchema(itemSchema).safeParse(value).success;
};

export const isRateLimitInfo = (value: unknown): value is RateLimitInfo => {
    return RateLimitInfoSchema.safeParse(value).success;
};