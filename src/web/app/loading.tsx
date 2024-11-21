// react v18.0.0
'use client';
import React from 'react';
import LoadingSpinner from '../components/shared/Loading';

// Human Tasks:
// 1. Verify loading component behavior during slow network conditions
// 2. Test loading state transitions with Next.js dev tools
// 3. Validate loading component appearance matches design system specs
// 4. Test loading state announcements with various screen readers

/**
 * Default loading UI component for Next.js route segments that displays during page transitions.
 * Provides visual feedback during page loads following design system and accessibility guidelines.
 * 
 * @component
 * @returns {JSX.Element} Loading component instance with full viewport layout
 */
const Loading: React.FC = () => {
  // Requirement: System Performance - Visual feedback for operations taking <200ms
  // Using large size spinner for better visibility during page transitions
  return (
    // Requirement: Design System Specifications - Using consistent spacing and layout
    <div 
      className="min-h-screen w-full flex items-center justify-center"
      // Requirement: Accessibility Requirements - WCAG 2.1 AA compliant ARIA attributes
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner
        // Using large size for better visibility during page transitions
        size="lg"
        // Requirement: Accessibility Requirements - Clear loading state communication
        label="Loading page content..."
        // Requirement: Design System Specifications - Using theme's secondary color
        color="secondary"
      />
    </div>
  );
};

export default Loading;