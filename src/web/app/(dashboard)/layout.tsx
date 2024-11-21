// Third-party imports
import React from 'react'; // ^18.0.0
import { redirect } from 'next/navigation'; // ^13.0.0

// Internal imports
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { AuthProvider } from '../../providers/AuthProvider';
import { ProgressProvider } from '../../providers/ProgressProvider';

/**
 * Human Tasks:
 * 1. Verify JWT token expiration settings in Supabase dashboard
 * 2. Test authentication redirects under different network conditions
 * 3. Validate WCAG 2.1 AA compliance with automated tools
 * 4. Monitor progress tracking performance and data revalidation
 */

// Props interface for the dashboard layout component
interface LayoutProps {
  children: React.ReactNode;
}

// Interface for auth state to fix implicit any type
interface AuthState {
  authenticated: boolean;
  loading: boolean;
}

/**
 * Root layout component for the dashboard section that provides authentication protection,
 * progress tracking, and consistent layout structure for all dashboard routes.
 * 
 * Requirement: User Interface Design - Implements main dashboard layout structure with responsive navigation
 * Requirement: Authentication & Authorization - Protects dashboard routes with JWT-based authentication
 * Requirement: User Management - Integrates progress tracking with automatic data revalidation
 */
export default function RootLayout({ children }: LayoutProps) {
  // Metadata configuration for dashboard pages
  const metadata = {
    title: 'Case Interview Practice Platform - Dashboard',
    description: 'Practice and improve your consulting case interview skills'
  };

  return (
    <AuthProvider>
      <ProgressProvider>
        {({ state }: { state: AuthState }) => {
          // Requirement: Authentication & Authorization - Protect dashboard routes
          if (!state.authenticated && !state.loading) {
            redirect('/login');
          }

          return (
            /* 
              Requirement: User Interface Design - Responsive layout following WCAG 2.1 AA
              Requirement: User Management - Progress tracking with SWR caching
            */
            <DashboardLayout>
              {children}
            </DashboardLayout>
          );
        }}
      </ProgressProvider>
    </AuthProvider>
  );
}

// Configure metadata for dashboard pages
export const metadata = {
  title: 'Case Interview Practice Platform - Dashboard',
  description: 'Practice and improve your consulting case interview skills'
};