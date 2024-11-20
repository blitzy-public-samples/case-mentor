// Third-party imports
import React, { forwardRef, type ForwardedRef } from 'react'; // ^18.0.0

// Internal imports
import { cn } from '../../lib/utils';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards
 * 2. Test with screen readers for proper label/input association
 * 3. Validate focus states with keyboard navigation testing
 * 4. Ensure error states are distinguishable for colorblind users
 */

// Requirement: User Interface Design - Consistent typography, color palette, and spacing across form elements
const defaultInputClasses = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';

// Requirement: User Interface Design - WCAG 2.1 AA compliant form inputs with full keyboard navigation and screen reader support
const errorInputClasses = 'border-red-300 focus:ring-red-500 placeholder:text-red-300';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, id, ...props }, ref: ForwardedRef<HTMLInputElement>) => {
    // Generate unique IDs for accessibility associations
    const inputId = id || React.useId();
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const ariaDescribedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {/* Requirement: User Interface Design - WCAG 2.1 AA compliant form inputs */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={ariaDescribedBy}
            className={cn(
              defaultInputClasses,
              error && errorInputClasses,
              className
            )}
            {...props}
          />
        </div>

        {/* Requirement: User Interface Design - Proper error message display for screen readers */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1 text-sm text-red-500"
          >
            {error}
          </p>
        )}

        {/* Requirement: User Interface Design - Accessible hint text */}
        {hint && (
          <p
            id={hintId}
            className="mt-1 text-sm text-gray-500"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

// Set display name for React DevTools
Input.displayName = 'Input';