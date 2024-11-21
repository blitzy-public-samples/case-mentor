// react v18.0.0
import React from 'react';
// class-variance-authority v0.7.0
import { cva } from 'class-variance-authority';

// Internal imports
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { SubscriptionPlan } from '../../types/subscription';
import { useSubscription } from '../../hooks/useSubscription';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards
 * 2. Test keyboard navigation and focus management
 * 3. Validate ARIA labels with screen readers
 * 4. Test loading states with assistive technologies
 */

// Requirement: Subscription System - Props interface for plan card component
interface PlanCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  isLoading?: boolean;
  onSelect?: () => void;
}

// Requirement: Design System Specifications - Plan card styling variants
const planCardVariants = cva('relative flex flex-col p-6', {
  variants: {
    container: {
      default: ['transition-all duration-200', 'hover:shadow-md']
    },
    header: {
      default: 'mb-4 space-y-2'
    },
    title: {
      default: ['text-xl font-semibold tracking-tight', 'text-gray-900']
    },
    price: {
      default: ['text-3xl font-bold', 'text-primary-600']
    },
    description: {
      default: ['text-sm text-gray-500', 'mb-4']
    },
    featureList: {
      default: 'space-y-3 mb-8'
    },
    featureItem: {
      default: ['flex items-center text-sm', 'text-gray-600']
    },
    checkIcon: {
      default: ['mr-3 h-4 w-4', 'text-green-500']
    },
    selectedBadge: {
      default: [
        'absolute top-4 right-4',
        'px-2 py-1 rounded-full',
        'bg-green-100 text-green-800',
        'text-xs font-medium'
      ]
    }
  },
  defaultVariants: {
    container: 'default',
    header: 'default',
    title: 'default',
    price: 'default',
    description: 'default',
    featureList: 'default',
    featureItem: 'default',
    checkIcon: 'default',
    selectedBadge: 'default'
  }
});

// Requirement: Subscription System - Plan card component implementation
export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected = false,
  isLoading = false,
  onSelect
}) => {
  // Requirement: Subscription System - Subscription state management
  const { updateSubscription } = useSubscription();

  // Requirement: Subscription System - Handle plan selection and upgrade
  const handleSelect = async () => {
    if (isSelected || isLoading) return;

    try {
      await updateSubscription(plan);
      onSelect?.();
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  // Requirement: Design System Specifications - Feature list rendering with accessibility
  const renderFeatures = () => (
    <ul 
      className={planCardVariants({ featureList: 'default' })}
      role="list"
      aria-label={`Features included in ${plan.name} plan`}
    >
      {plan.features.map((feature, index) => (
        <li 
          key={index}
          className={planCardVariants({ featureItem: 'default' })}
        >
          <svg
            className={planCardVariants({ checkIcon: 'default' })}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );

  return (
    // Requirement: Accessibility Requirements - WCAG 2.1 AA compliance
    <Card
      className={planCardVariants({ container: 'default' })}
      hoverable
      shadow={isSelected ? 'lg' : 'md'}
      aria-label={`${plan.name} subscription plan`}
    >
      {isSelected && (
        <span 
          className={planCardVariants({ selectedBadge: 'default' })}
          role="status"
          aria-label="Current plan"
        >
          Current Plan
        </span>
      )}

      <div className={planCardVariants({ header: 'default' })}>
        <h3 className={planCardVariants({ title: 'default' })}>{plan.name}</h3>
        <div className={planCardVariants({ price: 'default' })}>
          ${plan.price}
          <span className="text-sm text-gray-500">/month</span>
        </div>
      </div>

      <p className={planCardVariants({ description: 'default' })}>
        {plan.description}
      </p>

      {renderFeatures()}

      <div className="mt-auto">
        <Button
          onClick={handleSelect}
          disabled={isSelected}
          isLoading={isLoading}
          variant={isSelected ? 'secondary' : 'primary'}
          size="lg"
          className="w-full"
          aria-label={
            isSelected 
              ? `${plan.name} is your current plan` 
              : `Select ${plan.name} plan`
          }
        >
          {isSelected ? 'Current Plan' : 'Select Plan'}
        </Button>
      </div>
    </Card>
  );
};

export default PlanCard;