// Third-party imports
import React from 'react'; // ^18.0.0
import { redirect } from 'next/navigation'; // ^13.0.0

// Internal imports
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { AuthProvider } from '../../providers/AuthProvider';
import { ProgressProvider } from '../../providers/ProgressProvider';

/**
 * Root layout component for the dashboard section that provides authentication protection,
 * progress tracking, and consistent layout structure for all dashboard routes.
 * 
 * Requirement: User Interface Design - Implements main dashboard layout structure with responsive navigation
 * Requirement: Authentication & Authorization - Protects dashboard routes with JWT-based authentication
 * Requirement: User Management - Integrates progress tracking with automatic data revalidation
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProgressProvider>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </ProgressProvider>
    </AuthProvider>
  );
}

// Metadata is moved to a parent Server Component or page file as it is incompatible with "use client".
