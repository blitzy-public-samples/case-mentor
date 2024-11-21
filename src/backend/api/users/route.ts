/**
 * Human Tasks:
 * 1. Configure rate limiting middleware with Redis for distributed rate limiting
 * 2. Set up monitoring for authentication failures and suspicious activities
 * 3. Configure proper CORS settings for API endpoints
 * 4. Set up logging infrastructure for user operations
 * 5. Implement proper request validation error monitoring
 */

// @package next ^13.0.0
// @package zod ^3.22.0

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserService } from '../../services/UserService';
import { withAuth } from '../../lib/auth/middleware';
import { handleError } from '../../lib/errors/handlers';
import { APIErrorCode } from '../../types/api';
import { UserProfile, UserProfileSchema } from '../../types/user';

// Initialize UserService instance
const userService = new UserService();

// Validation schemas
const registrationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    profile: UserProfileSchema
});

const profileUpdateSchema = z.object({
    profile: UserProfileSchema
});

/**
 * GET /api/users - Retrieves authenticated user's profile and progress
 * Requirement: User Management - Profile customization, progress tracking
 */
export const GET = withAuth(async (
    request: NextRequest,
    context: { user: { id: string } }
): Promise<NextResponse> => {
    try {
        // Get user progress data with subscription validation
        const userProgress = await userService.getUserProgress(context.user.id);

        return NextResponse.json({
            success: true,
            data: userProgress,
            error: null,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        return handleError(error as Error, request.headers.get('x-request-id') || 'unknown');
    }
});

/**
 * POST /api/users - Handles user registration with profile creation
 * Requirement: Authentication - JWT-based authentication with secure session management
 */
export const POST = async (request: NextRequest): Promise<NextResponse> => {
    try {
        // Parse and validate registration data
        const data = await request.json();
        const validatedData = registrationSchema.parse(data);

        // Register new user
        const user = await userService.registerUser({
            email: validatedData.email,
            password: validatedData.password,
            profile: validatedData.profile
        });

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                profile: user.profile,
                subscriptionTier: user.subscriptionTier,
                subscriptionStatus: user.subscriptionStatus
            },
            error: null,
            metadata: {
                timestamp: new Date().toISOString()
            }
        }, { status: 201 });
    } catch (error: any) {
        return handleError(error as Error, request.headers.get('x-request-id') || 'unknown');
    }
};

/**
 * PUT /api/users - Updates authenticated user's profile
 * Requirement: User Management - Profile customization
 */
export const PUT = withAuth(async (
    request: NextRequest,
    context: { user: { id: string } }
): Promise<NextResponse> => {
    try {
        // Parse and validate profile update data
        const data = await request.json();
        const validatedData = profileUpdateSchema.parse(data);

        // Update user profile
        const updatedUser = await userService.updateProfile(
            context.user.id,
            validatedData.profile
        );

        return NextResponse.json({
            success: true,
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                profile: updatedUser.profile,
                subscriptionTier: updatedUser.subscriptionTier,
                subscriptionStatus: updatedUser.subscriptionStatus
            },
            error: null,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        return handleError(error as Error, request.headers.get('x-request-id') || 'unknown');
    }
});