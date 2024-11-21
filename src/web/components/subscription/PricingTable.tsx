// react v18.0.0
import React from 'react';
// class-variance-authority v0.7.0
import { cva } from 'class-variance-authority';

// Internal imports
import PlanCard from './PlanCard';
import { useSubscription } from '../../hooks/useSubscription';
import { SubscriptionPlan } from '../../types/subscription';

/**
 * Human Tasks:
 * 1. Verify Stripe price IDs match production configuration
 * 2. Test responsive layout across different screen sizes
 * 3. Validate accessibility with screen readers
 * 4. Test loading states and error handling
 */

// Requirement: Design System Specifications - Props interface for pricing table
interface PricingTableProps {
  plans: SubscriptionPlan[];
  className?: string;
}

// Requirement: Design System Specifications - Pricing table layout styles
const pricingTableVariants = {
  container: cva([
    // Base styles
    'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'py-12 sm:py-16 lg:py-20'
  ]),
  grid: cva([
    // Grid layout with responsive columns
    'grid gap-6',
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'items-start'
  ]),
  header: cva([
    'text-center mb-12',
    'space-y-4'
  ]),
  title: cva([
    'text-3xl font-bold tracking-tight',
    'text-gray-900 sm:text-4xl'
  ]),
  description: cva([
    'max-w-2xl mx-auto',
    'text-lg text-gray-600'
  ])
};

// Requirement: Subscription System - Pricing table component implementation
export const PricingTable: React.FC<PricingTableProps> = ({
  plans,
  className
}) => {
  // Requirement: Subscription System - Subscription state management
  const { 
    subscription, 
    updateSubscription, 
    isLoading 
  } = useSubscription();

  // Requirement: Subscription System - Handle plan selection
  const handlePlanSelect = async (plan: SubscriptionPlan): Promise<void> => {
    // Don't process if already subscribed to this plan
    if (subscription?.currentPlan.id === plan.id) {
      return;
    }

    try {
      // Attempt to update subscription through Stripe
      const response = await updateSubscription(plan);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Subscription update failed:', error);
      // Error handling would be implemented here
      // e.g., showing a toast notification
    }
  };

  return (
    // Requirement: Design System Specifications - Responsive layout implementation
    <div className={pricingTableVariants.container({ className })}>
      {/* Header section */}
      <div className={pricingTableVariants.header()}>
        <h2 className={pricingTableVariants.title()}>
          Choose the right plan for you
        </h2>
        <p className={pricingTableVariants.description()}>
          Get unlimited access to practice drills, McKinsey simulations, and expert feedback
        </p>
      </div>

      {/* Requirement: Rate Limiting - Display tier-based features */}
      <div 
        className={pricingTableVariants.grid()}
        role="group"
        aria-label="Subscription plans"
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={subscription?.currentPlan.id === plan.id}
            isLoading={isLoading && subscription?.currentPlan.id === plan.id}
            onSelect={() => handlePlanSelect(plan)}
          />
        ))}
      </div>
    </div>
  );
};

// Export PricingTable component
export default PricingTable;