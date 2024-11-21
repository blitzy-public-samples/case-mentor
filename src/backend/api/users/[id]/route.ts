/**
 * Human Tasks:
 * 1. Configure proper monitoring for user profile updates and subscription changes
 * 2. Set up alerts for failed authentication attempts and unauthorized access
 * 3. Review and adjust rate limits based on subscription tiers
 * 4. Ensure proper logging of sensitive user operations with PII redaction
 * 5. Set up automated testing for user profile validation rules
 */

// @package next ^13.0.0
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../services/UserService';
import { withAuth } from '../../../lib/auth/middleware';
import { APIError } from '../../../lib/errors/APIError';
import { UserSubscriptionTier, UserSubscriptionStatus } from '../../../types/user';

/**
 * GET handler for retrieving user profile and progress data
 * Addresses requirements:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Data Security (8. SECURITY CONSIDERATIONS/8.1 Authentication and Authorization)
 */
export const GET = withAuth(async (
    request: NextRequest,
    context: { user: { id: string } }
) => {
    try {
        const { params } = request;
        // Verify requesting user has access to requested profile
        if (context.user.id !== params.id) {
            throw new APIError(
                'AUTHORIZATION_ERROR',
                'Unauthorized access to user profile',
                { requestedUserId: params.id }
            );
        }

        // Initialize UserService and retrieve progress
        const userService = new UserService();
        const userProgress = await userService.getUserProgress(params.id);

        return NextResponse.json({
            success: true,
            data: userProgress,
            error: null
        }, { status: 200 });

    } catch (error) {
        if (error instanceof APIError) {
            return NextResponse.json(error.toJSON(), { 
                status: error.code === 'AUTHORIZATION_ERROR' ? 403 : 400 
            });
        }

        return NextResponse.json(new APIError(
            'INTERNAL_ERROR',
            'Failed to retrieve user data',
            { error: error instanceof Error ? error.message : 'Unknown error' }
        ).toJSON(), { status: 500 });
    }
});

/**
 * PATCH handler for updating user profile information
 * Addresses requirements:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Data Security (8. SECURITY CONSIDERATIONS/8.1 Authentication and Authorization)
 */
export const PATCH = withAuth(async (
    request: NextRequest,
    context: { user: { id: string } }
) => {
    try {
        const { params } = request;
        // Verify requesting user owns the profile
        if (context.user.id !== params.id) {
            throw new APIError(
                'AUTHORIZATION_ERROR',
                'Unauthorized profile modification',
                { requestedUserId: params.id }
            );
        }

        // Parse and validate request body
        const profileData = await request.json();
        if (!profileData) {
            throw new APIError(
                'VALIDATION_ERROR',
                'Profile data is required',
                { received: profileData }
            );
        }

        // Initialize UserService and update profile
        const userService = new UserService();
        const updatedUser = await userService.updateProfile(params.id, profileData);

        return NextResponse.json({
            success: true,
            data: updatedUser,
            error: null
        }, { status: 200 });

    } catch (error) {
        if (error instanceof APIError) {
            return NextResponse.json(error.toJSON(), {
                status: error.code === 'AUTHORIZATION_ERROR' ? 403 : 400
            });
        }

        return NextResponse.json(new APIError(
            'INTERNAL_ERROR',
            'Failed to update user profile',
            { error: error instanceof Error ? error.message : 'Unknown error' }
        ).toJSON(), { status: 500 });
    }
});

/**
 * DELETE handler for deactivating user account and canceling subscriptions
 * Addresses requirements:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 */
export const DELETE = withAuth(async (
    request: NextRequest,
    context: { user: { id: string } }
) => {
    try {
        const { params } = request;
        // Verify requesting user owns the account
        if (context.user.id !== params.id) {
            throw new APIError(
                'AUTHORIZATION_ERROR',
                'Unauthorized account deletion',
                { requestedUserId: params.id }
            );
        }

        // Initialize UserService and update subscription
        const userService = new UserService();
        await userService.updateSubscription(params.id, {
            tier: UserSubscriptionTier.FREE,
            status: UserSubscriptionStatus.CANCELED
        });

        return NextResponse.json({
            success: true,
            data: { message: 'Account successfully deactivated' },
            error: null
        }, { status: 200 });

    } catch (error) {
        if (error instanceof APIError) {
            return NextResponse.json(error.toJSON(), {
                status: error.code === 'AUTHORIZATION_ERROR' ? 403 : 400
            });
        }

        return NextResponse.json(new APIError(
            'INTERNAL_ERROR',
            'Failed to deactivate account',
            { error: error instanceof Error ? error.message : 'Unknown error' }
        ).toJSON(), { status: 500 });
    }
});