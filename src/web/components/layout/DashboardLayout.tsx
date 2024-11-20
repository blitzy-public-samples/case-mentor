// Third-party imports
import React from 'react'; // ^18.0.0
import { usePathname } from 'next/navigation'; // ^13.0.0
import { cn } from 'class-variance-authority'; // ^0.7.0

// Internal imports
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

/**
 * Human Tasks:
 * 1. Verify responsive breakpoints across different devices and screen sizes
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate color contrast ratios meet WCAG 2.1 AA standards
 * 4. Ensure proper touch targets for mobile devices (min 44x44px)
 */

// Layout breakpoints for responsive behavior
const LAYOUT_BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1440px'
} as const;

// Sidebar width configuration
const SIDEBAR_WIDTH = {
  COLLAPSED: '64px',
  EXPANDED: '256px'
} as const;

// Z-index configuration for layout elements
const LAYOUT_Z_INDEX = {
  HEADER: '50',
  SIDEBAR: '40',
  CONTENT: '0'
} as const;

// Props interface for DashboardLayout component
interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component for authenticated dashboard pages that provides consistent structure and responsive behavior
 * Requirement: User Interface Design - Implements main dashboard layout with header, sidebar, and content area
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Get authentication state
  const { state: authState } = useAuth();
  
  // Get current pathname for route-based styling
  const pathname = usePathname();

  // Requirement: Responsive Behavior - Adapts layout for different screen sizes
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Fixed position with proper z-index */}
      <Header 
        className={cn(
          "fixed top-0 left-0 right-0",
          "z-[var(--layout-z-header)]"
        )}
      />

      {/* Sidebar - Responsive with collapsible behavior */}
      <Sidebar />

      {/* Main content area */}
      <main
        className={cn(
          // Base layout styles
          "min-h-screen pt-16 transition-all duration-300",
          // Responsive padding and margin
          "ml-0 md:ml-64",
          "px-4 md:px-6 lg:px-8",
          // Content area styling
          "bg-gray-50 dark:bg-gray-900",
          "z-[var(--layout-z-content)]"
        )}
        // Requirement: Accessibility Requirements - Proper ARIA landmarks
        role="main"
        aria-label="Dashboard content"
      >
        {/* Content wrapper with max width constraint */}
        <div className={cn(
          "mx-auto max-w-7xl w-full",
          "py-6 md:py-8 lg:py-12"
        )}>
          {children}
        </div>
      </main>

      {/* CSS Custom Properties for z-index management */}
      <style jsx global>{`
        :root {
          --layout-z-header: ${LAYOUT_Z_INDEX.HEADER};
          --layout-z-sidebar: ${LAYOUT_Z_INDEX.SIDEBAR};
          --layout-z-content: ${LAYOUT_Z_INDEX.CONTENT};
        }

        /* Requirement: Responsive Behavior - Mobile-first breakpoints */
        @media (min-width: ${LAYOUT_BREAKPOINTS.MOBILE}) {
          .dashboard-sidebar {
            width: ${SIDEBAR_WIDTH.EXPANDED};
            transform: translateX(0);
          }
        }

        @media (max-width: ${LAYOUT_BREAKPOINTS.MOBILE}) {
          .dashboard-sidebar {
            width: ${SIDEBAR_WIDTH.COLLAPSED};
            transform: translateX(-100%);
          }
        }

        /* Requirement: Accessibility Requirements - Focus styles */
        .focus-visible:focus {
          outline: 2px solid var(--color-primary-base);
          outline-offset: 2px;
        }

        /* Requirement: Accessibility Requirements - Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .dashboard-layout * {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};