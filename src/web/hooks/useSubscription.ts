// Third-party imports
import { useState, useEffect, useCallback } from 'react'; // ^18.0.0
import { loadStripe } from '@stripe/stripe-js'; // ^2.0.0

// Internal imports
import { api } from '../lib/api';
import { getSession } from '../lib/auth';
import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  SubscriptionFeatures, 
  SubscriptionState, 
  SubscriptionResponse 
} from '../types/subscription';

/**
 * Human Tasks:
 * 1. Configure Stripe publishable key in environment variables
 * 2. Set up proper webhook endpoints for Stripe events
 * 3. Verify subscription plan IDs match Stripe dashboard configuration
 * 4. Test subscription upgrade/downgrade flows in staging environment
 * 5. Configure proper error monitoring for payment failures
 */

// Initialize Stripe instance
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/**
 * Custom hook for managing subscription state and operations
 * Requirement: Subscription System - Tiered access control, payment processing, account management
 */
export function useSubscription() {
  // State management for subscription data and loading states
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches current subscription data from API
   * Requirement: Subscription System - Account management
   */
  const fetchSubscription = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current session for authentication
      const session = await getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Fetch subscription data from API
      const response = await api.get<SubscriptionState>('/api/subscription');
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch subscription');
      }

      setSubscription(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Updates subscription plan through Stripe checkout
   * Requirement: Subscription System - Payment processing
   */
  const updateSubscription = useCallback(async (newPlan: SubscriptionPlan): Promise<SubscriptionResponse> => {
    try {
      setError(null);

      // Get current session
      const session = await getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Create Stripe checkout session
      const response = await api.post<{ sessionId: string }>('/api/subscription/checkout', {
        planId: newPlan.id,
        priceId: newPlan.stripePriceId
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create checkout session');
      }

      // Load Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Redirect to Stripe checkout
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Fetch updated subscription after successful payment
      await fetchSubscription();

      return {
        success: true,
        data: subscription!,
        error: null,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return {
        success: false,
        data: null as any,
        error: {
          code: 'SUBSCRIPTION_ERROR',
          message: error.message,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }
  }, [subscription, fetchSubscription]);

  /**
   * Cancels current subscription
   * Requirement: Subscription System - Account management
   */
  const cancelSubscription = useCallback(async (): Promise<SubscriptionResponse> => {
    try {
      setError(null);

      // Get current session
      const session = await getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Send cancellation request
      const response = await api.post<SubscriptionState>('/api/subscription/cancel', {
        subscriptionId: subscription?.stripeSubscriptionId
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to cancel subscription');
      }

      // Update local subscription state
      setSubscription(response.data);

      return {
        success: true,
        data: response.data,
        error: null,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return {
        success: false,
        data: null as any,
        error: {
          code: 'SUBSCRIPTION_ERROR',
          message: error.message,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }
  }, [subscription]);

  // Fetch subscription data on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    isLoading,
    error,
    updateSubscription,
    cancelSubscription
  };
}