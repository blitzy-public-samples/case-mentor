/**
 * Human Tasks:
 * 1. Verify PostCSS plugins are installed in package.json with correct versions
 * 2. Ensure build process is configured to use this PostCSS config file
 * 3. Test CSS processing pipeline in development and production environments
 */

// Import Tailwind configuration
// @ts-check
const config = require('./tailwind.config.ts')

// Requirement: Design System Implementation - Configure CSS processing pipeline
// tailwindcss v3.3.0
// postcss v8.4.24
// autoprefixer v10.4.14
module.exports = {
  // Requirement: Performance Optimization - Optimize CSS processing pipeline
  // Configure plugins in optimal order for processing efficiency
  plugins: [
    // Core Tailwind CSS processing with imported configuration
    // Uses theme tokens and content paths from tailwind.config.ts
    require('tailwindcss')(config),

    // Cross-browser compatibility through vendor prefixing
    // Enable flexbox and grid prefixing for maximum compatibility
    require('autoprefixer')({
      // Enable flexbox prefixing for broader browser support
      flexbox: true,
      // Enable Grid prefixing for IE11 and older browser support
      grid: true,
      // Requirement: Performance Optimization - Minimize processing overhead
      // Only add necessary prefixes based on browserslist config
      cascade: true,
      // Use efficient prefix calculations
      remove: true
    })
  ]
}