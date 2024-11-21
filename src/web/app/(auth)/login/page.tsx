// Third-party imports
import React from 'react'; // ^18.0.0
import { Metadata } from 'next'; // ^13.0.0

// Internal imports
import { LoginForm } from '@/components/auth/LoginForm';
import { Card } from '@/components/shared/Card';

/**
 * Human Tasks:
 * 1. Verify CORS settings for authentication endpoints
 * 2. Test keyboard navigation flow across login form
 * 3. Validate color contrast ratios with design system
 * 4. Test screen reader announcements for form states
 * 5. Verify SEO meta tags with marketing team
 */

// Requirement: Authentication Flow - SEO metadata configuration
export const metadata: Metadata = {
  title: 'Login | McKinsey Prep',
  description: 'Sign in to your McKinsey Prep account to access practice drills, simulations, and track your consulting interview preparation progress.',
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true
    }
  }
};

/**
 * Login page component that renders the authentication interface
 * with proper accessibility support and consistent styling.
 * 
 * Requirement: Authentication Flow - Implements secure user login flow
 * Requirement: User Interface Design - WCAG 2.1 AA compliant login page
 */
export default function LoginPage() {
  return (
    // Main container with proper ARIA landmarks
    <main 
      className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      aria-labelledby="login-heading"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Page heading with proper heading hierarchy */}
        <div className="text-center">
          <h1 
            id="login-heading"
            className="text-3xl font-bold tracking-tight text-gray-900"
          >
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Access your McKinsey Prep dashboard
          </p>
        </div>

        {/* Card container with consistent styling */}
        <Card
          shadow="md"
          padding="lg"
          className="bg-white"
          aria-label="Login form container"
        >
          {/* Login form with authentication logic */}
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}