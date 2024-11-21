// react v18.0.0
import React from 'react';
// class-variance-authority v0.7.0
import { cva } from 'class-variance-authority';
// Import theme tokens from relative path
import { shadows, spacing } from '../../config/theme';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards using a color contrast checker
 * 2. Test focus visibility across different browsers and color schemes
 * 3. Validate shadow values provide sufficient depth perception without being too harsh
 */

// Requirement: Design System Specifications - Core card component interface
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  shadow?: 'sm' | 'md' | 'lg';
  padding?: 'sm' | 'md' | 'lg';
}

// Requirement: Design System Specifications - Card style variants interface
interface CardVariantsProps {
  shadow?: 'sm' | 'md' | 'lg';
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

// Requirement: Design System Specifications - Consistent shadow and spacing application
const cardVariants = cva('rounded-lg bg-white', {
  variants: {
    shadow: {
      sm: `shadow-${shadows.sm}`,
      md: `shadow-${shadows.md}`,
      lg: `shadow-${shadows.lg}`,
    },
    padding: {
      sm: `p-${spacing.scale[1]}`,
      md: `p-${spacing.scale[3]}`,
      lg: `p-${spacing.scale[4]}`,
    },
    hoverable: {
      true: [
        'hover:shadow-lg hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        'active:shadow-md active:translate-y-0',
        'transition-all duration-200'
      ],
      false: '',
    },
  },
  defaultVariants: {
    shadow: 'md',
    padding: 'md',
    hoverable: false,
  },
});

// Requirement: Component Library - Core card component implementation
const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  shadow = 'md',
  padding = 'md',
  ...props
}) => {
  // Requirement: Accessibility Requirements - Proper ARIA attributes
  const ariaProps = {
    role: 'article',
    tabIndex: hoverable ? 0 : undefined,
  };

  return (
    <div
      className={cardVariants({ shadow, padding, hoverable, className })}
      {...ariaProps}
      {...props}
    >
      {children}
    </div>
  );
};

// Export card component and variants utility
export { Card, cardVariants };
export type { CardProps, CardVariantsProps };