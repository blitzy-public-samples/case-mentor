// External dependencies
import * as React from 'react' // ^18.0.0
import { Slot } from '@radix-ui/react-slot' // ^1.0.0
import { cn } from 'class-variance-authority' // ^0.7.0

// Internal dependencies
import { colors, shadows } from '../../config/theme'

/**
 * Human Tasks:
 * 1. Verify color contrast ratios for all button variants using a color contrast checker
 * 2. Test keyboard navigation and focus states across different browsers
 * 3. Validate ARIA attributes with screen readers
 * 4. Ensure loading states are properly announced by assistive technologies
 */

interface ButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  asChild?: boolean
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

// Requirement: Design System Implementation - Core button styles using design system tokens
export const buttonVariants = ({
  variant = 'default',
  size = 'md',
  className = ''
}: Partial<ButtonProps>) => {
  return cn(
    // Base styles with focus and disabled states
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    
    // Variant-specific styles using theme tokens
    {
      // Default variant
      'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:bg-gray-100':
        variant === 'default',
      
      // Primary variant using theme colors
      [`bg-[${colors.primary.base}] text-white hover:bg-[${colors.primary.hover}] active:bg-[${colors.primary.active}]`]:
        variant === 'primary',
      
      // Secondary variant using theme colors
      [`bg-[${colors.secondary.base}] text-white hover:bg-[${colors.secondary.hover}] active:bg-[${colors.secondary.active}]`]:
        variant === 'secondary',
      
      // Ghost variant
      'bg-transparent hover:bg-gray-100 active:bg-gray-200':
        variant === 'ghost',
      
      // Link variant
      'bg-transparent underline-offset-4 hover:underline':
        variant === 'link',
    },
    
    // Size-specific styles
    {
      'text-xs px-2.5 py-1.5 h-7': size === 'xs',
      'text-sm px-3 py-2 h-8': size === 'sm',
      'text-base px-4 py-2 h-10': size === 'md',
      'text-lg px-6 py-3 h-12': size === 'lg',
    },
    
    // Shadow styles from theme
    variant !== 'ghost' && variant !== 'link' ? shadows.sm : '',
    
    className
  )
}

// Requirement: Component Library - Core button component implementation
// Requirement: Accessibility Requirements - WCAG 2.1 AA compliance
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'default',
      size = 'md',
      asChild = false,
      isLoading = false,
      disabled = false,
      onClick,
      type = 'button',
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    
    return (
      <Comp
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        disabled={isLoading || disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        role="button"
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center space-x-2">
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">Loading</span>
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { type ButtonProps }