// @package stripe ^12.0.0
import { Stripe } from 'stripe';
import { 
    stripeConfig, 
    stripeClient, 
    SUBSCRIPTION_PRODUCTS, 
    WEBHOOK_EVENTS 
} from '../../config/stripe';
import { 
    SubscriptionPlan, 
    Subscription 
} from '../../types/subscription';
import { APIError } from '../errors/APIError';
import { APIErrorCode } from '../../types/api';

/**
 * Human Tasks:
 * 1. Set up Stripe webhook endpoint in dashboard and update webhook secret
 * 2. Configure proper error monitoring for payment processing
 * 3. Set up logging infrastructure for payment events
 * 4. Ensure proper SSL configuration for webhook endpoints
 * 5. Configure proper CORS settings for client-side Stripe.js
 */

// Requirement: Payment Processing - Customer creation and management
export async function createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
        const customer = await stripeClient.customers.create({
            email,
            name,
            metadata: {
                platform: 'case-interview-practice'
            }
        });
        return customer;
    } catch (error) {
        throw new APIError(
            APIErrorCode.INTERNAL_ERROR,
            'Failed to create customer',
            { email, error: error instanceof Error ? error.message : 'Unknown error' }
        );
    }
}

// Requirement: Subscription System - Subscription creation and payment setup
export async function createSubscription(
    customerId: string,
    priceId: string,
    paymentMethod: Stripe.PaymentMethod
): Promise<Stripe.Subscription> {
    try {
        // Attach payment method to customer
        await stripeClient.paymentMethods.attach(paymentMethod.id, {
            customer: customerId
        });

        // Set as default payment method
        await stripeClient.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethod.id
            }
        });

        // Create the subscription
        const subscription = await stripeClient.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: 'on_subscription'
            },
            expand: ['latest_invoice.payment_intent']
        });

        return subscription;
    } catch (error) {
        throw new APIError(
            APIErrorCode.INTERNAL_ERROR,
            'Failed to create subscription',
            { customerId, priceId, error: error instanceof Error ? error.message : 'Unknown error' }
        );
    }
}

// Requirement: Payment Processing - Webhook handling and signature validation
export async function handleWebhook(
    rawBody: Buffer,
    signature: string
): Promise<{ type: string; data: any }> {
    try {
        const event = await validateAndConstructEvent(rawBody, signature);
        
        switch (event.type) {
            case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
            case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
            case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
                const subscription = event.data.object as Stripe.Subscription;
                return {
                    type: event.type,
                    data: subscription
                };

            case WEBHOOK_EVENTS.PAYMENT_SUCCEEDED:
            case WEBHOOK_EVENTS.PAYMENT_FAILED:
                const invoice = event.data.object as Stripe.Invoice;
                return {
                    type: event.type,
                    data: invoice
                };

            default:
                throw new APIError(
                    APIErrorCode.VALIDATION_ERROR,
                    'Unhandled webhook event type',
                    { eventType: event.type }
                );
        }
    } catch (error) {
        throw new APIError(
            APIErrorCode.VALIDATION_ERROR,
            'Failed to process webhook',
            { error: error instanceof Error ? error.message : 'Unknown error' }
        );
    }
}

// Requirement: Payment Processing - Secure webhook signature validation
export async function validateWebhookSignature(
    payload: Buffer,
    signature: string
): Promise<boolean> {
    try {
        await validateAndConstructEvent(payload, signature);
        return true;
    } catch (error) {
        return false;
    }
}

// Requirement: Subscription System - Subscription updates and changes
export async function updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
    try {
        const subscription = await stripeClient.subscriptions.update(
            subscriptionId,
            {
                ...params,
                proration_behavior: 'create_prorations'
            }
        );
        return subscription;
    } catch (error) {
        throw new APIError(
            APIErrorCode.INTERNAL_ERROR,
            'Failed to update subscription',
            { subscriptionId, error: error instanceof Error ? error.message : 'Unknown error' }
        );
    }
}

// Requirement: Subscription System - Subscription cancellation handling
export async function cancelSubscription(
    subscriptionId: string,
    cancelImmediately: boolean = false
): Promise<Stripe.Subscription> {
    try {
        const subscription = await stripeClient.subscriptions.update(subscriptionId, {
            cancel_at_period_end: !cancelImmediately,
            ...(cancelImmediately && { status: 'canceled' })
        });
        return subscription;
    } catch (error) {
        throw new APIError(
            APIErrorCode.INTERNAL_ERROR,
            'Failed to cancel subscription',
            { subscriptionId, error: error instanceof Error ? error.message : 'Unknown error' }
        );
    }
}

// Requirement: Payment Processing - Payment intent creation for subscriptions
export async function createPaymentIntent(
    customerId: string,
    amount: number,
    currency: string = 'usd'
): Promise<Stripe.PaymentIntent> {
    try {
        const paymentIntent = await stripeClient.paymentIntents.create({
            amount,
            currency,
            customer: customerId,
            automatic_payment_methods: {
                enabled: true
            },
            metadata: {
                platform: 'case-interview-practice'
            }
        });
        return paymentIntent;
    } catch (error) {
        throw new APIError(
            APIErrorCode.INTERNAL_ERROR,
            'Failed to create payment intent',
            { customerId, amount, error: error instanceof Error ? error.message : 'Unknown error' }
        );
    }
}

// Helper function to validate and construct Stripe webhook events
async function validateAndConstructEvent(
    payload: Buffer,
    signature: string
): Promise<Stripe.Event> {
    try {
        const event = stripeClient.webhooks.constructEvent(
            payload,
            signature,
            stripeConfig.webhookSecret
        );
        return event;
    } catch (error) {
        throw new APIError(
            APIErrorCode.VALIDATION_ERROR,
            'Failed to validate webhook signature',
            { error: error instanceof Error ? error.message : 'Unknown error' }
        );
    }
}