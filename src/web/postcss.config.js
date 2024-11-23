/**
 * Human Tasks:
 * 1. Verify PostCSS plugins are installed in package.json with correct versions.
 * 2. Ensure the build process is configured to use this PostCSS config file.
 * 3. Test the CSS processing pipeline in both development and production environments.
 */

// Import `ts-node` to enable TypeScript in TailwindCSS configuration files
require('ts-node').register();

module.exports = {
  // Requirement: Performance Optimization - Optimize CSS processing pipeline
  plugins: {
    // Core Tailwind CSS processing
    tailwindcss: {}, // Automatically detects `tailwind.config.ts`

    // Cross-browser compatibility through vendor prefixing
    autoprefixer: {}, // Default options for better compatibility
  },
};
