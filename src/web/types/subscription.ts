// @ts-check

/**
 * Human Tasks:
 * 1. Verify Stripe product and price IDs match production configuration
 * 2. Ensure rate limit values align with subscription tiers in backend
 * 3. Validate feature flags match product offering
 * 4. Configure proper date serialization format for subscription dates
 */

// Internal imports
import { APIResponse } from './api';  // Import from relative path
import { UserSubscriptionTier } from './user';  // Import from relative path

// External imports
import type { Stripe } from '@stripe/stripe-js';  // ^2.0.0

// Requirement: Subscription System - Interface for subscription plan details including Stripe integration
export interface SubscriptionPlan {
  // Unique identifier for the subscription plan
  id: string;
  // Display name of the subscription plan
  name: string;
  // Detailed description of plan benefits
  description: string;
  // Monthly price in cents
  price: number;
  // Billing interval (monthly/yearly)
  interval: string;
  // List of features included in the plan
  features: string[];
  // Associated subscription tier
  tier: UserSubscriptionTier;
  // Stripe product identifier for payment processing
  stripeProductId: string;
  // Stripe price identifier for payment processing
  stripePriceId: string;
}

// Requirement: Subscription System - Enumeration of possible subscription payment statuses
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID'
}

// Requirement: Rate Limiting - Feature flags and limits for each subscription tier
export interface SubscriptionFeatures {
  // Number of practice drills allowed per day
  drillsPerDay: number;
  // Access to McKinsey simulation game
  simulationAccess: boolean;
  // Access to AI-powered evaluation
  aiEvaluation: boolean;
  // Access to detailed progress analytics
  progressAnalytics: boolean;
}

// Requirement: Subscription System - Interface for frontend subscription state management
export interface SubscriptionState {
  // Current active subscription plan
  currentPlan: SubscriptionPlan;
  // Current subscription payment status
  status: SubscriptionStatus;
  // Active feature flags and limits
  features: SubscriptionFeatures;
  // Subscription start date (ISO 8601)
  startDate: string;
  // Subscription end date (ISO 8601)
  endDate: string;
  // Auto-renewal status
  autoRenew: boolean;
  // Stripe subscription identifier
  stripeSubscriptionId: string;
  // Stripe customer identifier
  stripeCustomerId: string;
}

// Requirement: Subscription System - Type alias for subscription-related API responses
export type SubscriptionResponse = APIResponse<SubscriptionState>;