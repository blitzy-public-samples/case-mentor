'use client';

// External dependencies
import * as React from 'react'; // ^18.0.0
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'; // ^2.0.0
import { loadStripe } from '@stripe/stripe-js';

// Internal dependencies
import { buttonVariants } from '../shared/Button';
import { useSubscription } from '../../hooks/useSubscription';
import type { SubscriptionPlan } from '../../types/subscription';

/**
 * Human Tasks:
 * 1. Configure Stripe publishable key in environment variables
 * 2. Test payment form with screen readers for accessibility
 * 3. Verify error messages are properly announced by assistive technologies
 * 4. Test keyboard navigation flow across all form elements
 * 5. Validate color contrast ratios for all states
 */

// Requirement: Subscription System - Props interface for payment form
interface PaymentFormProps {
  selectedPlan: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

// Requirement: Accessibility Requirements - WCAG compliant card element styles
const cardElementStyles = {
  base: {
    fontSize: '16px',
    color: '#0F172A',
    '::placeholder': {
      color: '#64748B',
    },
    ':focus': {
      outline: 'none',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
    },
  },
  invalid: {
    color: '#EF4444',
    ':focus': {
      boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.5)',
    },
  },
};

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Requirement: Subscription System - Payment form component with Stripe integration
export function PaymentForm({ selectedPlan, onSuccess, onCancel }: PaymentFormProps) {
  // Initialize Stripe hooks and state
  const stripe = useStripe();
  const elements = useElements();
  const { updateSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cardComplete, setCardComplete] = React.useState(false);

  // Requirement: Accessibility Requirements - Handle card element changes
  const handleCardChange = (event: { complete: boolean; error: any }) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  // Requirement: Subscription System - Handle form submission and payment processing
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !cardComplete) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create payment method with Stripe
      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Process subscription update with payment details
      const response = await updateSubscription({
        ...selectedPlan,
        stripeProductId: selectedPlan.stripeProductId,
        stripePriceId: selectedPlan.stripePriceId
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Payment processing failed');
      }

      // Call success callback
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      // Announce error to screen readers
      const errorRegion = document.getElementById('payment-error');
      if (errorRegion) {
        errorRegion.focus();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Requirement: Accessibility Requirements - Render WCAG compliant payment form
  return (
    <Elements stripe={stripePromise}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6"
        aria-label="Payment form"
      >
        {/* Plan summary */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedPlan.name}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            ${selectedPlan.price / 100}/month
          </p>
        </div>

        {/* Card input section */}
        <div className="space-y-4">
          <label
            htmlFor="card-element"
            className="block text-sm font-medium text-gray-700"
          >
            Card details
          </label>
          <div
            id="card-element"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            role="group"
            aria-label="Credit or debit card"
          >
            <CardElement
              options={{
                style: cardElementStyles,
                aria: {
                  label: 'Credit or debit card input',
                },
              }}
              onChange={handleCardChange}
            />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div
            id="payment-error"
            role="alert"
            aria-live="polite"
            className="rounded-md bg-red-50 p-4 text-sm text-red-700"
            tabIndex={-1}
          >
            <p>{error}</p>
          </div>
        )}

        {/* Form actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className={buttonVariants({
              variant: 'ghost',
              size: 'lg',
              className: 'min-w-[120px]',
            })}
            disabled={isProcessing}
            aria-label="Cancel payment"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={buttonVariants({
              variant: 'primary',
              size: 'lg',
              className: 'min-w-[120px]',
            })}
            disabled={!cardComplete || isProcessing}
            aria-label={isProcessing ? 'Processing payment' : 'Pay now'}
          >
            {isProcessing ? 'Processing...' : 'Pay now'}
          </button>
        </div>

        {/* Processing indicator for screen readers */}
        {isProcessing && (
          <div
            className="sr-only"
            role="status"
            aria-live="polite"
          >
            Processing your payment...
          </div>
        )}
      </form>
    </Elements>
  );
}

// Requirement: Subscription System - Export named interface
export type { PaymentFormProps };