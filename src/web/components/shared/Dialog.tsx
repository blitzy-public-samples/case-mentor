// External dependencies
import * as React from 'react' // ^18.0.0
import * as DialogPrimitive from '@radix-ui/react-dialog' // ^1.0.0
import { cn } from 'class-variance-authority' // ^0.7.0

// Internal dependencies
import { buttonVariants } from './Button'

/**
 * Human Tasks:
 * 1. Verify dialog animations work smoothly across different browsers
 * 2. Test focus trapping with screen readers
 * 3. Validate ARIA announcements for dialog state changes
 * 4. Check color contrast ratios in both light and dark themes
 */

interface DialogProps {
  children: React.ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  showCloseButton?: boolean
}

// Requirement: Design System Implementation - Core dialog styles using design system tokens
const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ children, className, open, onOpenChange, modal = true, ...props }, ref) => {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
        {/* Requirement: Accessibility Requirements - WCAG 2.1 AA compliance with proper ARIA */}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              'fixed inset-0 z-50 bg-black/50',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
            )}
          />
          {children}
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }
)

Dialog.displayName = 'Dialog'

// Requirement: Component Library - Core dialog content implementation with shadcn/ui patterns
const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className, title, description, showCloseButton = true, ...props }, ref) => {
    return (
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Base styles
          'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-lg rounded-lg bg-white p-6',
          'shadow-lg focus:outline-none',
          // Animation classes
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
          'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
          className
        )}
        {...props}
      >
        {/* Requirement: Accessibility Requirements - Semantic heading structure */}
        {title && (
          <DialogPrimitive.Title
            className="text-lg font-semibold leading-none tracking-tight"
          >
            {title}
          </DialogPrimitive.Title>
        )}
        
        {description && (
          <DialogPrimitive.Description
            className="mt-2 text-sm text-gray-500"
          >
            {description}
          </DialogPrimitive.Description>
        )}
        
        <div className="mt-4">{children}</div>

        {/* Requirement: Accessibility Requirements - Keyboard accessible close button */}
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'absolute right-4 top-4',
              'focus:ring-2 focus:ring-offset-2',
              'disabled:pointer-events-none'
            )}
            aria-label="Close dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    )
  }
)

DialogContent.displayName = 'DialogContent'

// Requirement: Component Library - Dialog trigger implementation
const DialogTrigger = DialogPrimitive.Trigger

// Requirement: Component Library - Dialog close implementation
const DialogClose = DialogPrimitive.Close

// Export all dialog components
export {
  Dialog as Root,
  DialogTrigger as Trigger,
  DialogContent as Content,
  DialogClose as Close,
}