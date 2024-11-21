// @ts-check
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography' // v0.5.10
import forms from '@tailwindcss/forms' // v0.5.7
import { colors, fontFamily, spacing, breakpoints, shadows } from './config/theme'

/**
 * Human Tasks:
 * 1. Verify all color contrast ratios meet WCAG 2.1 AA standards using a color contrast checker
 * 2. Ensure Inter and Roboto Mono fonts are properly loaded in the application
 * 3. Test responsive breakpoints across different devices and viewports
 */

// Requirement: Design System Specifications - Create screen breakpoint configuration
const createScreenConfig = (breakpoints: Record<string, string>) => {
  return Object.entries(breakpoints).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: `min-width: ${value}`
  }), {})
}

// Requirement: Design System Specifications - Core configuration
const config: Config = {
  // Requirement: Component Library - Content paths for component styles
  content: [
    './**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  
  // Enable dark mode with class strategy
  darkMode: 'class',
  
  theme: {
    // Requirement: Design System Specifications - Extend default theme
    extend: {
      // Requirement: Design System Specifications - Typography configuration
      fontFamily: {
        ...fontFamily
      },
      
      // Requirement: Accessibility Requirements - WCAG compliant colors
      colors: {
        ...colors
      },
      
      // Requirement: Design System Specifications - Spacing scale
      spacing: Object.entries(spacing.scale).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: `${value}px`
      }), {}),
      
      // Requirement: Design System Specifications - Responsive breakpoints
      screens: createScreenConfig(breakpoints),
      
      // Requirement: Design System Specifications - Elevation shadows
      boxShadow: {
        ...shadows
      },
      
      // Requirement: Component Library - Typography plugin customization
      typography: {
        DEFAULT: {
          css: {
            color: colors.primary.base,
            a: {
              color: colors.secondary.base,
              '&:hover': {
                color: colors.secondary.hover
              }
            },
            strong: {
              color: colors.primary.base
            },
            h1: {
              color: colors.primary.base,
              fontWeight: '700'
            },
            h2: {
              color: colors.primary.base,
              fontWeight: '600'
            },
            h3: {
              color: colors.primary.base,
              fontWeight: '600'
            },
            code: {
              color: colors.primary.base,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25em',
              fontFamily: fontFamily.mono.join(', ')
            },
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            }
          }
        }
      }
    }
  },
  
  // Requirement: Component Library - Configure required plugins
  plugins: [
    typography(),
    forms({
      strategy: 'class'
    })
  ]
}

export default config