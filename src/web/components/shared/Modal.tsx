// External dependencies
import * as React from 'react' // ^18.0.0

// Internal dependencies
import { Root, Content } from './Dialog'
import { buttonVariants } from './Button'

/**
 * Human Tasks:
 * 1. Verify modal animations work smoothly across different browsers
 * 2. Test focus trapping with screen readers
 * 3. Validate ARIA announcements for modal state changes
 * 4. Check color contrast ratios in both light and dark themes
 */

// Requirement: Design System Implementation - Modal component props interface
interface ModalProps {
  children: React.ReactNode
  className?: string
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  modal?: boolean
}

// Requirement: Component Library - Core modal component implementation
const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    children,
    className = '',
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    showCloseButton = true,
    modal = true,
    ...props
  }, ref) => {
    // Requirement: Design System Implementation - Size-specific styles using design system tokens
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    }

    // Requirement: Accessibility Requirements - WCAG 2.1 AA compliance with proper ARIA attributes
    return (
      <Root
        open={isOpen}
        onOpenChange={onClose}
        modal={modal}
      >
        <Content
          ref={ref}
          className={`${sizeClasses[size]} ${className}`}
          title={title}
          description={description}
          showCloseButton={showCloseButton}
          {...props}
        >
          {children}
        </Content>
      </Root>
    )
  }
)

// Requirement: Component Library - Component display name for debugging
Modal.displayName = 'Modal'

export { Modal, type ModalProps }