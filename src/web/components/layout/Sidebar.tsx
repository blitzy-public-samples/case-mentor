// External dependencies
import * as React from 'react' // ^18.0.0
import { usePathname } from 'next/navigation' // ^13.0.0
import Link from 'next/link' // ^13.0.0
import { clsx } from 'clsx' // For className merging

// Internal dependencies
import { buttonVariants } from '../shared/Button'
import { useAuth } from '../../hooks/useAuth'
import { routes } from '../../config/routes'

/**
 * Human Tasks:
 * 1. Verify color contrast ratios for navigation items meet WCAG 2.1 AA standards
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate mobile menu behavior across different devices
 * 4. Ensure proper touch targets for mobile devices (min 44x44px)
 */

// Requirement: Core Features Navigation - Mobile breakpoint for responsive behavior
const MOBILE_BREAKPOINT = 768

// Requirement: User Interface Design - Sidebar navigation component
export const Sidebar = () => {
  // State for mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  
  // Get current pathname for active route highlighting
  const pathname = usePathname()
  
  // Access authentication state and logout function
  const { state: authState, logout } = useAuth()

  // Requirement: Core Features Navigation - Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  // Requirement: Accessibility Requirements - Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      toggleMobileMenu()
    }
  }

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300',
        'bg-white border-r border-gray-200 p-4',
        'md:translate-x-0',
        !isMobileMenuOpen && '-translate-x-full md:translate-x-0'
      )}
      aria-label="Main navigation"
    >
      {/* Requirement: User Interface Design - Logo and branding section */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/dashboard"
          className="flex items-center space-x-3"
          aria-label="McKinsey Prep Dashboard"
        >
          <span className="text-xl font-semibold">McKinsey Prep</span>
        </Link>
        
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden rounded-lg p-2 hover:bg-gray-100"
          onClick={toggleMobileMenu}
          onKeyDown={handleKeyDown}
          aria-expanded={isMobileMenuOpen}
          aria-controls="sidebar-menu"
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {/* Requirement: Core Features Navigation - Main navigation menu */}
      <nav id="sidebar-menu" className="space-y-1">
        {routes.dashboard.map((route) => (
          <NavItem
            key={route.path}
            href={route.path}
            label={route.path.slice(1).charAt(0).toUpperCase() + route.path.slice(2)}
            icon={getRouteIcon(route.path)}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        ))}
      </nav>

      {/* Requirement: User Interface Design - User profile section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        {authState.user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {authState.user.email?.[0].toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{authState.user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className={clsx(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'text-gray-600 hover:text-gray-900'
              )}
              aria-label="Sign out"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

// Requirement: Accessibility Requirements - Navigation item component with ARIA support
const NavItem = ({ href, icon, label, onClick }: {
  href: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'w-full justify-start',
        isActive && 'bg-gray-100 text-gray-900',
        !isActive && 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="inline-flex items-center justify-center w-5 h-5 mr-3" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Link>
  )
}

// Helper function to get route icons
const getRouteIcon = (path: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    '/dashboard': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    '/drills': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    '/simulation': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    '/progress': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    '/settings': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }

  return icons[path] || null
}