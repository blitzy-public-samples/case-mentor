// External dependencies
import Link from 'next/link' // ^13.0.0

// Internal dependencies
import { Button } from '../components/shared/Button'

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards for error text
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate page title updates correctly in browser
 */

// Requirement: User Interface Design - Implements consistent design system components
// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant error page
export default function NotFound() {
  return (
    // Main container with semantic role for accessibility
    <main
      role="main"
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center"
    >
      {/* Primary heading for proper document structure */}
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
        404 - Page Not Found
      </h1>

      {/* Descriptive error message with sufficient color contrast */}
      <p className="mb-8 max-w-lg text-base text-gray-600">
        We couldn't find the page you're looking for. Please check the URL or
        return to the dashboard to continue your practice session.
      </p>

      {/* Navigation button with accessible name */}
      <Link href="/dashboard" className="inline-block">
        <Button
          variant="primary"
          size="md"
          ariaLabel="Return to dashboard"
        >
          Return to Dashboard
        </Button>
      </Link>
    </main>
  )
}

// Requirement: User Interface Design - Metadata for error page
export const metadata = {
  title: 'Page Not Found - Case Interview Practice Platform',
  description: 'The requested page could not be found.'
}