// @package stripe ^12.0.0
import { Stripe } from 'stripe';
import { SubscriptionPlan } from '../types/subscription';
import { RATE_LIMITS } from './constants';

/**
 * Human Tasks:
 * 1. Set up Stripe account and obtain API keys
 * 2. Create products and price plans in Stripe dashboard matching SUBSCRIPTION_PRODUCTS
 * 3. Configure webhook endpoint URL in Stripe dashboard
 * 4. Set up proper error monitoring for payment processing
 * 5. Implement proper logging for payment events
 */

// Requirement: Payment Processing - Core Stripe configuration
export const stripeConfig = {
    publicKey: process.env.NEXT_PUBLIC_STRIPE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: STRIPE_API_VERSION
};

// Requirement: Payment Processing - Stripe API version and webhook settings
const STRIPE_API_VERSION = '2023-10-16' as const;
const STRIPE_WEBHOOK_TOLERANCE = 300; // 5 minutes tolerance for webhook timestamps

// Requirement: Subscription System - Product definitions with features and limits
export const SUBSCRIPTION_PRODUCTS: Record<string, SubscriptionPlan> = {
    FREE: {
        id: 'free-tier',
        name: 'Free Tier',
        tier: 'FREE',
        stripeProductId: process.env.STRIPE_FREE_PRODUCT_ID || '',
        priceMonthly: 0,
        priceYearly: 0,
        features: [
            {
                id: 'basic-drills',
                name: 'Basic Practice Drills',
                description: 'Access to fundamental case practice drills',
                enabled: true
            },
            {
                id: 'progress-tracking',
                name: 'Basic Progress Tracking',
                description: 'Track your practice completion and scores',
                enabled: true
            }
        ],
        limits: {
            drillAttemptsPerDay: RATE_LIMITS.free.drills,
            simulationAttemptsPerDay: RATE_LIMITS.free.simulations,
            apiRequestsPerHour: RATE_LIMITS.free.evaluations
        }
    },
    BASIC: {
        id: 'basic-tier',
        name: 'Basic Plan',
        tier: 'BASIC',
        stripeProductId: process.env.STRIPE_BASIC_PRODUCT_ID || '',
        priceMonthly: 1999, // $19.99
        priceYearly: 19990, // $199.90
        features: [
            {
                id: 'advanced-drills',
                name: 'Advanced Practice Drills',
                description: 'Access to comprehensive case practice drills',
                enabled: true
            },
            {
                id: 'detailed-feedback',
                name: 'Detailed AI Feedback',
                description: 'In-depth analysis of your performance',
                enabled: true
            },
            {
                id: 'progress-analytics',
                name: 'Progress Analytics',
                description: 'Detailed performance analytics and insights',
                enabled: true
            }
        ],
        limits: {
            drillAttemptsPerDay: RATE_LIMITS.basic.drills,
            simulationAttemptsPerDay: RATE_LIMITS.basic.simulations,
            apiRequestsPerHour: RATE_LIMITS.basic.evaluations
        }
    },
    PREMIUM: {
        id: 'premium-tier',
        name: 'Premium Plan',
        tier: 'PREMIUM',
        stripeProductId: process.env.STRIPE_PREMIUM_PRODUCT_ID || '',
        priceMonthly: 4999, // $49.99
        priceYearly: 49990, // $499.90
        features: [
            {
                id: 'all-features',
                name: 'All Platform Features',
                description: 'Full access to all platform capabilities',
                enabled: true
            },
            {
                id: 'priority-support',
                name: 'Priority Support',
                description: 'Fast-track support response',
                enabled: true
            },
            {
                id: 'custom-drills',
                name: 'Custom Practice Drills',
                description: 'Personalized practice scenarios',
                enabled: true
            }
        ],
        limits: {
            drillAttemptsPerDay: RATE_LIMITS.premium.drills,
            simulationAttemptsPerDay: RATE_LIMITS.premium.simulations,
            apiRequestsPerHour: RATE_LIMITS.premium.evaluations
        }
    }
};

// Requirement: Payment Processing - Webhook event types
export const WEBHOOK_EVENTS = {
    SUBSCRIPTION_CREATED: 'customer.subscription.created',
    SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
    PAYMENT_FAILED: 'invoice.payment_failed'
} as const;

// Requirement: Payment Processing - Stripe client initialization
export const createStripeClient = (secretKey: string, apiVersion: string): Stripe => {
    if (!secretKey) {
        throw new Error('Stripe secret key is required');
    }

    return new Stripe(secretKey, {
        apiVersion: apiVersion as Stripe.LatestApiVersion,
        typescript: true,
        timeout: 10000, // 10 second timeout
        maxNetworkRetries: 3
    });
};

// Requirement: Payment Processing - Initialize Stripe client
export const stripeClient = createStripeClient(stripeConfig.secretKey, stripeConfig.apiVersion);

// Requirement: Payment Processing - Webhook signature validation
export const validateWebhookSignature = (
    payload: string,
    signature: string,
    webhookSecret: string
): boolean => {
    try {
        const event = stripeClient.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
        );
        
        // Verify webhook timestamp is within tolerance window
        const timestamp = event.created;
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (currentTime - timestamp > STRIPE_WEBHOOK_TOLERANCE) {
            throw new Error('Webhook timestamp is too old');
        }
        
        return true;
    } catch (error) {
        console.error('Webhook signature validation failed:', error);
        return false;
    }
};