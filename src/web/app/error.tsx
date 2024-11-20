'use client'

// External dependencies
import * as React from 'react' // ^18.0.0
import { useEffect } from 'react' // ^18.0.0

// Internal dependencies
import { Alert } from '../components/shared/Alert'
import { Button } from '../components/shared/Button'
import { handleAPIError } from '../lib/utils'

// Requirement: Error Handling - Standardized error display and handling across application
interface ErrorProps {
  error: Error
  reset: () => void
}

// Requirement: System Performance - Error tracking and user feedback for 95% of requests
// Requirement: Error Handling - Standardized error display and handling across application
// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant error messages
const Error: React.FC<ErrorProps> = ({ error, reset }) => {
  // Set focus on error container when mounted for accessibility
  const errorContainerRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    // Set focus on error container for screen readers
    if (errorContainerRef.current) {
      errorContainerRef.current.focus()
    }
  }, [error])

  // Format error message based on error type
  const errorMessage = error.name === 'APIError' 
    ? handleAPIError(error as any) 
    : error.message || 'An unexpected error occurred'

  return (
    <div 
      ref={errorContainerRef}
      tabIndex={-1}
      className="p-4 max-w-2xl mx-auto"
      role="alert"
      aria-live="assertive"
    >
      <Alert
        variant="error"
        title="Something went wrong"
        action={{
          label: 'Try again',
          onClick: reset
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-red-800">
            {errorMessage}
          </p>
          
          {/* Additional recovery options */}
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={reset}
              aria-label="Retry the failed operation"
            >
              Retry
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              aria-label="Reload the page"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  )
}

export default Error