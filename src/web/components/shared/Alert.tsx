// External dependencies
import * as React from 'react' // ^18.0.0
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react' // ^0.294.0
import { clsx } from 'clsx' // For className merging

// Internal dependencies
import { buttonVariants } from './Button'

// Requirement: Design System Specifications - Alert component interface
interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

// Requirement: Design System Specifications - Alert icon mapping
const getAlertIcon = (variant: AlertProps['variant'] = 'info'): React.ElementType => {
  const icons = {
    info: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle
  }
  return icons[variant]
}

// Requirement: Design System Specifications - Alert component implementation
// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant alert implementation
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  action,
  className
}) => {
  // Get the appropriate icon component
  const IconComponent = getAlertIcon(variant)

  // Base styles following design system specifications
  const baseStyles = 'rounded-lg p-4 mb-4 flex items-start gap-3'
  
  // Variant-specific styles with WCAG 2.1 AA compliant color contrast
  const variantStyles = {
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    success: 'bg-green-50 text-green-800 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    error: 'bg-red-50 text-red-800 border border-red-200'
  }

  // Icon styles with appropriate sizing and color
  const iconStyles = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  }

  return (
    // Requirement: Accessibility Requirements - Proper ARIA roles and live regions
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={clsx(
        baseStyles,
        variantStyles[variant],
        className
      )}
    >
      {/* Alert icon */}
      <IconComponent className={clsx('h-5 w-5', iconStyles[variant])} aria-hidden="true" />

      <div className="flex-1">
        {/* Alert title */}
        {title && (
          <h3 className="font-medium mb-1">
            {title}
          </h3>
        )}

        {/* Alert content */}
        <div className="text-sm">
          {children}
        </div>

        {/* Optional action button */}
        {action && (
          <div className="mt-3">
            <button
              type="button"
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: iconStyles[variant]
              })}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {/* Dismissible button */}
      {dismissible && onDismiss && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={onDismiss}
          className={clsx(
            'p-1 rounded-md hover:bg-opacity-20 hover:bg-gray-900 transition-colors',
            iconStyles[variant]
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// Export the Alert component
export default Alert