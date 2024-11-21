// @package next ^13.0.0
// @package stripe ^12.0.0

/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint URL in dashboard for subscription events
 * 2. Set up monitoring for failed subscription creation attempts
 * 3. Configure proper error alerting for payment processing failures
 * 4. Set up logging for subscription lifecycle events
 * 5. Review and adjust rate limits for subscription creation endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/auth/middleware';
import { SubscriptionService } from '../../../services/SubscriptionService';
import { APIError } from '../../../lib/errors/APIError';
import { APIErrorCode } from '../../../types/api';
import { Stripe } from 'stripe';

// Initialize subscription service
const subscriptionService = new SubscriptionService();

/**
 * Handles POST requests to create new subscriptions
 * Requirement: Subscription System - Tiered access control, payment processing, account management
 * Requirement: Payment Processing - Payment handling via Stripe integration
 */
export const POST = withAuth(async (
    request: NextRequest,
    context: { user: { id: string } }
) => {
    try {
        // Extract request body
        const body = await request.json();
        const { planId, paymentMethodId } = body;

        // Validate required parameters
        if (!planId || !paymentMethodId) {
            throw new APIError(
                APIErrorCode.VALIDATION_ERROR,
                'Missing required parameters',
                {
                    required: ['planId', 'paymentMethodId'],
                    received: { planId, paymentMethodId }
                }
            );
        }

        // Create subscription using service
        const subscription = await subscriptionService.createSubscription(
            context.user.id,
            planId,
            paymentMethodId
        );

        // Return success response
        return NextResponse.json({
            success: true,
            data: subscription,
            error: null,
            metadata: {
                created: new Date().toISOString()
            }
        }, { status: 201 });

    } catch (error) {
        // Handle known API errors
        if (error instanceof APIError) {
            return NextResponse.json({
                success: false,
                data: null,
                error: error.toJSON(),
                metadata: {}
            }, { status: 400 });
        }

        // Handle Stripe errors
        if (error instanceof Error && 'type' in error && typeof error.type === 'string' && error.type.startsWith('Stripe')) {
            const stripeError = error as Stripe.StripeError;
            return NextResponse.json({
                success: false,
                data: null,
                error: new APIError(
                    APIErrorCode.INTERNAL_ERROR,
                    'Payment processing failed',
                    {
                        stripeError: stripeError.message
                    }
                ).toJSON(),
                metadata: {}
            }, { status: 500 });
        }

        // Handle unexpected errors
        const unknownError = error as Error;
        console.error('Subscription creation failed:', unknownError);
        return NextResponse.json({
            success: false,
            data: null,
            error: new APIError(
                APIErrorCode.INTERNAL_ERROR,
                'Failed to create subscription',
                {
                    message: unknownError.message
                }
            ).toJSON(),
            metadata: {}
        }, { status: 500 });
    }
});