'use client';

// react v18.0.0
import React, { useState, useCallback } from 'react';
// @stripe/stripe-js v2.0.0
import { loadStripe } from '@stripe/stripe-js';
// Add missing dependency
import { Elements } from '@stripe/react-stripe-js';

// Internal imports
import PricingTable from '../../../components/subscription/PricingTable';
import { PaymentForm } from '../../../components/subscription/PaymentForm';
import { useSubscription } from '../../../hooks/useSubscription';
import type { SubscriptionPlan } from '../../../types/subscription';

/**
 * Human Tasks:
 * 1. Configure Stripe publishable key in environment variables
 * 2. Test subscription upgrade/downgrade flows in staging
 * 3. Verify accessibility with screen readers
 * 4. Test responsive layout across devices
 */

// Requirement: Subscription System - Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Requirement: Design System Specifications - Subscription page styles
const styles = {
  container: 'min-h-screen bg-gray-50 py-8',
  content: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  header: 'text-center mb-12',
  title: 'text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl',
  description: 'mt-4 text-lg text-gray-600 max-w-2xl mx-auto',
  loadingState: 'flex items-center justify-center min-h-[400px]',
  errorState: 'p-4 rounded-md bg-red-50 text-red-700 my-4',
  paymentSection: 'mt-12 max-w-md mx-auto',
};

// Requirement: Subscription System - Main subscription page component
export default function SubscriptionPage() {
  // Initialize subscription hook and state
  const { subscription, updateSubscription, isLoading, error } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Requirement: Subscription System - Handle plan selection
  const handlePlanSelect = useCallback(async (plan: SubscriptionPlan) => {
    // Don't process if already subscribed to this plan
    if (subscription?.currentPlan?.id === plan.id) {
      return;
    }

    setSelectedPlan(plan);

    // Handle plan downgrades directly through API
    if (subscription?.currentPlan?.price && plan.price && subscription.currentPlan.price > plan.price) {
      try {
        const response = await updateSubscription(plan);
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to update subscription');
        }
        // Announce success to screen readers
        const alert = document.createElement('div');
        alert.setAttribute('role', 'alert');
        alert.setAttribute('aria-live', 'polite');
        alert.textContent = 'Subscription updated successfully';
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
      } catch (error) {
        console.error('Subscription update failed:', error);
      }
      return;
    }

    // Show payment form for upgrades
    setShowPayment(true);
  }, [subscription, updateSubscription]);

  // Requirement: Subscription System - Handle successful payment
  const handlePaymentSuccess = useCallback(async () => {
    setShowPayment(false);
    setSelectedPlan(null);
    
    // Announce success to screen readers
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'polite');
    alert.textContent = 'Payment processed successfully';
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
  }, []);

  // Requirement: Subscription System - Handle payment cancellation
  const handlePaymentCancel = useCallback(() => {
    setShowPayment(false);
    setSelectedPlan(null);

    // Announce cancellation to screen readers
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'polite');
    alert.textContent = 'Payment cancelled';
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.loadingState} role="status" aria-live="polite">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        <span className="sr-only">Loading subscription details...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div 
        className={styles.errorState}
        role="alert"
        aria-live="assertive"
      >
        <p>Failed to load subscription details: {error.message}</p>
      </div>
    );
  }

  return (
    // Requirement: Design System Specifications - Responsive layout
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header section */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            Choose Your Plan
          </h1>
          <p className={styles.description}>
            Get unlimited access to practice drills, McKinsey simulations, and expert feedback
          </p>
        </div>

        {/* Requirement: Rate Limiting - Display subscription plans with tier-based features */}
        <PricingTable
          plans={subscription?.currentPlan?.features || []}
          className="mb-8"
        />

        {/* Requirement: Subscription System - Payment processing section */}
        {showPayment && selectedPlan && (
          <div className={styles.paymentSection}>
            <Elements stripe={stripePromise}>
              <PaymentForm
                selectedPlan={selectedPlan}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          </div>
        )}

        {/* Requirement: Accessibility Requirements - Current subscription status */}
        {subscription && (
          <div 
            className="mt-8 text-center text-gray-600"
            role="status"
            aria-live="polite"
          >
            <p>
              Current plan: {subscription.currentPlan.name}
              {subscription.status === 'ACTIVE' && ' (Active)'}
            </p>
            {subscription.endDate && (
              <p>
                Renewal date: {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}