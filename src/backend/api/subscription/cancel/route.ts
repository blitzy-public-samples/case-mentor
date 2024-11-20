// @package next ^13.0.0
// @package zod ^3.22.0

/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint for subscription cancellation events
 * 2. Set up monitoring alerts for subscription cancellations
 * 3. Implement subscription cancellation analytics tracking
 * 4. Configure proper logging for cancellation events
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '../../../lib/auth/middleware';
import { SubscriptionService } from '../../../services/SubscriptionService';
import { handleError } from '../../../lib/errors/handlers';

// Initialize subscription service
const subscriptionService = new SubscriptionService();

// Requirement: Subscription System - Validate cancellation request parameters
const cancelRequestSchema = z.object({
    subscriptionId: z.string().uuid(),
    immediately: z.boolean().optional()
});

/**
 * Protected route handler for subscription cancellation requests
 * Requirement: Subscription System - Secure subscription management
 * Requirement: Security Controls - Authentication and authorization for subscription management
 */
export const DELETE = withAuth(async (
    request: NextRequest,
    context: { user: { id: string } }
): Promise<NextResponse> => {
    try {
        // Extract request parameters
        const requestData = await request.json();
        
        // Validate request parameters
        const validatedData = cancelRequestSchema.parse(requestData);
        const { subscriptionId, immediately = false } = validatedData;

        // Process cancellation through subscription service
        await subscriptionService.cancelSubscription(
            subscriptionId,
            immediately
        );

        // Return success response
        return NextResponse.json({
            success: true,
            data: null,
            error: null,
            metadata: {
                cancelledAt: new Date().toISOString(),
                immediately
            }
        }, { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        // Handle errors using standardized error handler
        return handleError(error, request.headers.get('x-request-id') || 'unknown');
    }
});