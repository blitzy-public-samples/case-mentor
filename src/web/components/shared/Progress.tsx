// Third-party imports
import React from 'react'; // ^18.0.0
import { clsx } from 'clsx'; // Using clsx instead of cn from class-variance-authority

// Internal imports
import { formatScore } from '../../lib/utils';
import { colors } from '../../config/theme';

// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards using a color contrast checker
// 2. Test progress component with screen readers for proper ARIA support
// 3. Validate animation performance across different browsers

interface ProgressProps {
  // Current progress value between 0 and max
  value: number;
  // Maximum possible value
  max: number;
  // Size variant: 'sm' | 'md' | 'lg'
  size?: 'sm' | 'md' | 'lg';
  // Color variant: 'primary' | 'secondary' | 'accent'
  variant?: 'primary' | 'secondary' | 'accent';
  // Whether to show percentage label
  showLabel?: boolean;
  // Optional custom class names
  className?: string;
  // Custom ARIA label for accessibility
  ariaLabel?: string;
}

// Requirement: Design System Specifications - Implements consistent progress visualization
const progressVariants = () => {
  return {
    base: clsx(
      'relative w-full overflow-hidden rounded-full bg-gray-100 transition-all',
      'dark:bg-gray-700'
    ),
    size: {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6'
    } as const,
    variant: {
      primary: clsx(
        'bg-primary-base',
        'dark:bg-primary-base'
      ),
      secondary: clsx(
        'bg-secondary-base',
        'dark:bg-secondary-base'
      ),
      accent: clsx(
        'bg-accent-base',
        'dark:bg-accent-base'
      )
    } as const
  };
};

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant progress indicators with ARIA support
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      max = 100,
      size = 'md',
      variant = 'primary',
      showLabel = false,
      className,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    // Calculate percentage and ensure it's between 0-100
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    // Get style variants
    const variants = progressVariants();
    
    // Generate class names
    const containerClasses = clsx(
      variants.base,
      variants.size[size],
      className
    );
    
    const barClasses = clsx(
      'h-full transition-all duration-300 ease-in-out',
      variants.variant[variant]
    );

    // Format percentage for display and ARIA
    const formattedPercentage = formatScore(percentage / 100);
    
    // Requirement: User Engagement - Visual progress tracking
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || `Progress: ${formattedPercentage}`}
        className={containerClasses}
        {...props}
      >
        <div
          className={barClasses}
          style={{
            width: `${percentage}%`,
            backgroundColor: colors[variant]?.base
          }}
        />
        {showLabel && (
          <span className={clsx(
            'absolute inset-0 flex items-center justify-center text-sm font-medium',
            percentage > 50 ? 'text-white' : 'text-gray-700 dark:text-gray-200'
          )}>
            {formattedPercentage}
          </span>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress;