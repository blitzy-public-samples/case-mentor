// @package stripe ^12.0.0
// @package next ^13.0.0

/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint URL in Stripe dashboard
 * 2. Set up monitoring for webhook failures and payment processing errors
 * 3. Configure proper logging for webhook events
 * 4. Set up alerts for failed payment notifications
 * 5. Ensure proper error tracking for webhook processing failures
 */

import { NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { handleWebhook, validateWebhookSignature } from '../../../lib/stripe/webhooks';
import { SubscriptionService } from '../../../services/SubscriptionService';
import { handleError } from '../../../lib/errors/handlers';
import { APIResponse } from '../../../types/api';

// Initialize subscription service
const subscriptionService = new SubscriptionService();

/**
 * Handles incoming Stripe webhook events for subscription management.
 * Implements secure webhook signature validation and standardized error handling.
 * 
 * Requirement: Subscription System - Payment processing integration
 * - Processes subscription lifecycle events from Stripe
 * - Validates webhook signatures for security
 * 
 * Requirement: Payment Processing - Webhook event handling
 * - Handles subscription creation, updates, and cancellations
 * - Processes payment success and failure events
 */
export async function POST(
    req: NextRequest
): Promise<NextResponse<APIResponse<{ received: boolean }>>> {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

    try {
        // Extract Stripe signature from headers
        const signature = req.headers.get('stripe-signature');
        if (!signature) {
            throw new Error('Missing Stripe signature header');
        }

        // Get raw request body as text for signature validation
        const rawBody = await req.text();
        if (!rawBody) {
            throw new Error('Empty request body');
        }

        // Validate webhook signature
        const isValid = await validateWebhookSignature(rawBody, signature);
        if (!isValid) {
            throw new Error('Invalid webhook signature');
        }

        // Parse webhook event data
        const event = JSON.parse(rawBody) as Stripe.Event;

        // Process webhook event using subscription service
        await subscriptionService.handleWebhook(event);

        // Return success response
        const response: APIResponse<{ received: boolean }> = {
            success: true,
            data: { received: true },
            error: null,
            metadata: {
                eventType: event.type,
                eventId: event.id,
                requestId
            }
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        // Create error response with the expected type
        const errorResponse: APIResponse<{ received: boolean }> = {
            success: false,
            data: { received: false },
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                details: {},
                timestamp: new Date().toISOString(),
                requestId
            },
            metadata: {}
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}