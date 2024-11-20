// react v18.0.0
import React from 'react';
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority';
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
const cardVariants = ({ shadow = 'md', padding = 'md', hoverable = false }: CardVariantsProps) => {
  // Map padding sizes to theme spacing values
  const paddingMap = {
    sm: `${spacing.scale[1]}px`, // 8px
    md: `${spacing.scale[3]}px`, // 16px
    lg: `${spacing.scale[4]}px`, // 24px
  };

  // Map shadow sizes to theme shadow values
  const shadowMap = {
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
  };

  return cn(
    // Base styles
    'rounded-lg bg-white',
    // Requirement: Accessibility Requirements - Ensure sufficient color contrast
    'border border-gray-200',
    
    // Apply padding based on size
    `p-${paddingMap[padding]}`,
    
    // Apply shadow based on size
    `shadow-${shadowMap[shadow]}`,
    
    // Requirement: Accessibility Requirements - Smooth transitions for hover states
    'transition-all duration-200',
    
    // Hoverable state with accessible focus indication
    hoverable && [
      'hover:shadow-lg hover:-translate-y-1',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      'active:shadow-md active:translate-y-0'
    ]
  );
};

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
      className={cn(
        cardVariants({ shadow, padding, hoverable }),
        className
      )}
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