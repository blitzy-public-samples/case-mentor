// External dependencies
import React from 'react' // ^18.0.0
import Link from 'next/link' // ^13.0.0

// Internal dependencies
import { buttonVariants } from '../shared/Button'
import { routes } from '../../config/routes'
import { SUBSCRIPTION_TIERS } from '../../config/constants'

/**
 * Human Tasks:
 * 1. Verify all external links open in new tabs with proper security attributes
 * 2. Test footer responsiveness across all breakpoints
 * 3. Validate color contrast ratios meet WCAG 2.1 AA standards
 * 4. Ensure all interactive elements are keyboard accessible
 * 5. Test screen reader navigation and content hierarchy
 */

// Requirement: Design System Implementation - Footer navigation links
const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Case Types', href: '/#cases' }
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Documentation', href: '/docs' },
    { label: 'FAQ', href: '/faq' }
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' }
  ],
  social: [
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Twitter', href: 'https://twitter.com' },
    { label: 'GitHub', href: 'https://github.com' }
  ]
} as const

// Requirement: Component Library - Core footer component implementation
export const Footer = (): React.ReactElement => {
  const currentYear = new Date().getFullYear()

  return (
    // Requirement: Accessibility Requirements - WCAG 2.1 AA compliance
    <footer 
      role="contentinfo"
      className="w-full bg-gray-50 border-t border-gray-200"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Product Links Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Product
            </h2>
            <ul className="mt-4 space-y-4">
              {FOOTER_LINKS.product.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Resources
            </h2>
            <ul className="mt-4 space-y-4">
              {FOOTER_LINKS.resources.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Legal
            </h2>
            <ul className="mt-4 space-y-4">
              {FOOTER_LINKS.legal.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Connect
            </h2>
            <ul className="mt-4 space-y-4">
              {FOOTER_LINKS.social.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: 'link',
                      className: 'text-gray-600 hover:text-gray-900'
                    })}
                    aria-label={`Visit our ${label} page`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Subscription Tiers Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(SUBSCRIPTION_TIERS).map(([tier, details]) => (
              <div key={tier} className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tier} Plan
                </h3>
                <p className="mt-2 text-gray-600">
                  Starting at ${details.price}/month
                </p>
                <Link
                  href={`${routes.public.find(r => r.path === '/')?.path}#pricing`}
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'mt-4'
                  })}
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            &copy; {currentYear} Case Interview Practice Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer