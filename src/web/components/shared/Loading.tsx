// react v18.0.0
import React from 'react';
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority';
import { colors, spacing } from '../../config/theme';

// Human Tasks:
// 1. Verify that the loading animation performs well across different browsers
// 2. Test loading states with screen readers to ensure proper ARIA announcement
// 3. Validate color contrast ratios when using custom colors from the theme

interface LoadingProps {
  /**
   * Controls the size of the spinner using theme spacing tokens
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Color of the spinner from theme's WCAG compliant color palette
   * @default theme.colors.secondary.base
   */
  color?: keyof typeof colors;
  /**
   * Additional CSS classes for custom styling
   */
  className?: string;
  /**
   * Accessibility label for screen readers following ARIA best practices
   * @default 'Loading...'
   */
  label?: string;
}

/**
 * Determines spinner dimensions based on size prop using theme spacing tokens
 * @param size - The desired size of the spinner
 * @returns Object containing width and height dimensions
 */
const getSpinnerSize = (size: LoadingProps['size'] = 'md'): { width: number; height: number } => {
  // Requirement: Design System Specifications - Using spacing tokens for consistent sizing
  switch (size) {
    case 'sm':
      return { width: spacing.scale[3], height: spacing.scale[3] }; // 16px
    case 'lg':
      return { width: spacing.scale[6], height: spacing.scale[6] }; // 48px
    case 'md':
    default:
      return { width: spacing.scale[5], height: spacing.scale[5] }; // 32px
  }
};

/**
 * A reusable loading spinner component that provides visual feedback during
 * asynchronous operations, following the application's design system and
 * accessibility guidelines.
 * 
 * @component
 */
const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = 'secondary',
  className,
  label = 'Loading...'
}) => {
  // Requirement: System Performance - Optimized SVG animation for <200ms visual feedback
  const dimensions = getSpinnerSize(size);
  
  // Requirement: Design System Specifications - Using theme colors for consistent styling
  const spinnerColor = colors[color]?.base || colors.secondary.base;
  
  return (
    // Requirement: Accessibility Requirements - WCAG 2.1 AA compliant ARIA attributes
    <div
      role="status"
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      <svg
        className="animate-spin"
        style={{
          width: '100%',
          height: '100%',
          color: spinnerColor
        }}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Background circle */}
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        {/* Spinner arc */}
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {/* Requirement: Accessibility Requirements - Hidden text for screen readers */}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Loading;