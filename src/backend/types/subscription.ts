// @package stripe ^12.0.0
import { Stripe } from 'stripe';
import { 
    UserSubscriptionTier, 
    UserSubscriptionStatus 
} from './user';

/**
 * Human Tasks:
 * 1. Configure Stripe product and price IDs in environment variables
 * 2. Set up Stripe webhook endpoints for subscription status updates
 * 3. Configure rate limiting middleware with the defined limits
 * 4. Implement usage tracking mechanisms for drill attempts, simulations, and API requests
 * 5. Set up monitoring and alerts for usage threshold violations
 */

// Requirement: Subscription System - Tiered access control
export interface SubscriptionPlan {
    id: string;
    name: string;
    tier: UserSubscriptionTier;
    priceMonthly: number;  // Price in cents
    priceYearly: number;   // Price in cents
    features: SubscriptionFeature[];
    limits: SubscriptionLimits;
    stripeProductId: string;
}

// Requirement: Subscription System - Feature access control
export interface SubscriptionFeature {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
}

// Requirement: Rate Limiting - Different API rate limits based on subscription tier
export interface SubscriptionLimits {
    drillAttemptsPerDay: number;
    simulationAttemptsPerDay: number;
    apiRequestsPerHour: number;
}

// Requirement: Subscription System - Payment processing integration
export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    status: UserSubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
}

// Requirement: Rate Limiting - Usage tracking for compliance
export interface SubscriptionUsage {
    subscriptionId: string;
    drillAttempts: number;
    simulationAttempts: number;
    apiRequests: number;
    period: Date;  // The date for which usage is being tracked
}

// Type guard for subscription plan validation
export const isSubscriptionPlan = (value: unknown): value is SubscriptionPlan => {
    if (typeof value !== 'object' || value === null) return false;
    
    const plan = value as SubscriptionPlan;
    return (
        typeof plan.id === 'string' &&
        typeof plan.name === 'string' &&
        Object.values(UserSubscriptionTier).includes(plan.tier) &&
        typeof plan.priceMonthly === 'number' &&
        typeof plan.priceYearly === 'number' &&
        Array.isArray(plan.features) &&
        typeof plan.stripeProductId === 'string' &&
        plan.features.every(isSubscriptionFeature)
    );
};

// Type guard for subscription feature validation
export const isSubscriptionFeature = (value: unknown): value is SubscriptionFeature => {
    if (typeof value !== 'object' || value === null) return false;
    
    const feature = value as SubscriptionFeature;
    return (
        typeof feature.id === 'string' &&
        typeof feature.name === 'string' &&
        typeof feature.description === 'string' &&
        typeof feature.enabled === 'boolean'
    );
};

// Type guard for subscription limits validation
export const isSubscriptionLimits = (value: unknown): value is SubscriptionLimits => {
    if (typeof value !== 'object' || value === null) return false;
    
    const limits = value as SubscriptionLimits;
    return (
        typeof limits.drillAttemptsPerDay === 'number' &&
        typeof limits.simulationAttemptsPerDay === 'number' &&
        typeof limits.apiRequestsPerHour === 'number'
    );
};

// Type guard for subscription validation
export const isSubscription = (value: unknown): value is Subscription => {
    if (typeof value !== 'object' || value === null) return false;
    
    const subscription = value as Subscription;
    return (
        typeof subscription.id === 'string' &&
        typeof subscription.userId === 'string' &&
        typeof subscription.planId === 'string' &&
        Object.values(UserSubscriptionStatus).includes(subscription.status) &&
        subscription.currentPeriodStart instanceof Date &&
        subscription.currentPeriodEnd instanceof Date &&
        typeof subscription.cancelAtPeriodEnd === 'boolean' &&
        typeof subscription.stripeSubscriptionId === 'string' &&
        typeof subscription.stripeCustomerId === 'string'
    );
};

// Type guard for subscription usage validation
export const isSubscriptionUsage = (value: unknown): value is SubscriptionUsage => {
    if (typeof value !== 'object' || value === null) return false;
    
    const usage = value as SubscriptionUsage;
    return (
        typeof usage.subscriptionId === 'string' &&
        typeof usage.drillAttempts === 'number' &&
        typeof usage.simulationAttempts === 'number' &&
        typeof usage.apiRequests === 'number' &&
        usage.period instanceof Date
    );
};