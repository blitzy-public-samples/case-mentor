/**
 * Human Tasks:
 * 1. Verify tooltip behavior across different screen sizes and devices
 * 2. Test keyboard navigation and screen reader compatibility
 * 3. Validate color contrast ratios in both light and dark modes
 * 4. Ensure proper focus management when tooltip is triggered
 */

import React, { useState, useEffect, useCallback } from 'react' // ^18.0.0
import * as RadixTooltip from '@radix-ui/react-tooltip' // ^1.0.0
import clsx from 'clsx'
import { shadows, colors } from '../../config/theme'

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant tooltip interface
interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
  className?: string
}

// Requirement: Design System Specifications - Optimal tooltip positioning
const getTooltipPosition = (triggerRect: DOMRect, tooltipRect: DOMRect) => {
  const OFFSET = 8 // Based on theme.spacing.base * 2
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  let top = 0
  let left = 0

  // Calculate initial position
  switch (true) {
    case triggerRect.top > tooltipRect.height + OFFSET:
      // Position above
      top = triggerRect.top - tooltipRect.height - OFFSET
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case viewport.height - triggerRect.bottom > tooltipRect.height + OFFSET:
      // Position below
      top = triggerRect.bottom + OFFSET
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    default:
      // Position right
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.right + OFFSET
  }

  // Prevent viewport overflow
  left = Math.max(OFFSET, Math.min(left, viewport.width - tooltipRect.width - OFFSET))
  top = Math.max(OFFSET, Math.min(top, viewport.height - tooltipRect.height - OFFSET))

  return { top, left }
}

// Requirement: Design System Specifications - Consistent styling from theme
const tooltipStyles = {
  content: clsx(
    'z-50 rounded-md px-4 py-2 text-sm',
    'bg-white dark:bg-gray-800',
    'text-gray-900 dark:text-gray-100',
    'shadow-sm',
    'animate-fade-in duration-200',
    'outline-none focus:ring-2 focus:ring-primary-500'
  ),
  arrow: clsx(
    'fill-white dark:fill-gray-800'
  )
}

// Requirement: Accessibility Requirements - WCAG compliant tooltip component
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleTooltipMount = useCallback((node: HTMLDivElement) => {
    if (!node) return

    // Apply custom positioning if needed
    const triggerRect = node.parentElement?.getBoundingClientRect()
    const tooltipRect = node.getBoundingClientRect()

    if (triggerRect && tooltipRect) {
      const { top, left } = getTooltipPosition(triggerRect, tooltipRect)
      node.style.transform = `translate3d(${left}px, ${top}px, 0)`
    }
  }, [])

  if (!mounted) return <>{children}</>

  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger
          className="inline-block focus:outline-none"
          aria-describedby="tooltip"
        >
          {children}
        </RadixTooltip.Trigger>

        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={position}
            sideOffset={5}
            className={clsx(tooltipStyles.content, className)}
            onMouseEnter={(e) => e.preventDefault()}
            ref={handleTooltipMount}
          >
            {content}
            <RadixTooltip.Arrow className={tooltipStyles.arrow} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

// Export the props interface for external use
export type { TooltipProps }