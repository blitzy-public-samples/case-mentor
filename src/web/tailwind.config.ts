// @ts-check
import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

// Define custom theme variables
const customColors = {
  primary: {
    DEFAULT: '#1D4ED8', // Default primary color
    base: '#1D4ED8',    // Explicit base color
    hover: '#2563EB',   // Hover color
    dark: '#1E3A8A',    // Darker shade
    400: '#60A5FA',     // Light shade
    600: '#2563EB',     // Darker shade
  },
  secondary: {
    DEFAULT: '#9333EA', // Default secondary color
    base: '#9333EA',    // Explicit base color
    hover: '#7E22CE',   // Hover color
    dark: '#6B21A8',    // Darker shade
  },
};

const customFontFamily = {
  sans: ['Inter', 'sans-serif'],
  mono: ['Roboto Mono', 'monospace'],
};

const customBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

const customSpacing = {
  px: '1px',
  '0.5': '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

const customShadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
};

// Helper function to create screen configurations
const createScreenConfig = (breakpoints: Record<string, string>) => {
  return Object.entries(breakpoints).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value,
    }),
    {}
  );
};

// TailwindCSS configuration
const config: Config = {
  mode: 'jit', // Enable Just-In-Time (JIT) mode for faster builds
  content: [
    './layout.tsx',
    './error.tsx',
    './loading.tsx',
    './not-found.tsx',
    './page.tsx',
    './output.css',
    './globals.css',
    './(auth)/**/*.{js,ts,jsx,tsx}',
    './(dashboard)/**/*.{js,ts,jsx,tsx}',
  ],
  
  darkMode: 'class', // Use class-based dark mode

  safelist: [
    'text-primary',
    'hover:text-primary',
    'text-primary-400',
    'text-primary-600',
    'hover:text-primary-700',
  ], // Explicitly include classes to prevent purging

  theme: {
    extend: {
      fontFamily: customFontFamily, // Apply custom fonts
      colors: customColors, // Apply custom colors with all variants
      spacing: customSpacing, // Assign custom spacing values
      screens: createScreenConfig(customBreakpoints), // Configure custom breakpoints
      boxShadow: customShadows, // Add custom shadows
      typography: {
        DEFAULT: {
          css: {
            color: customColors.primary.base,
            a: {
              color: customColors.secondary.base,
              '&:hover': {
                color: customColors.secondary.hover,
              },
            },
            strong: {
              color: customColors.primary.base,
            },
            h1: {
              color: customColors.primary.base,
              fontWeight: '700',
            },
            h2: {
              color: customColors.primary.base,
              fontWeight: '600',
            },
            h3: {
              color: customColors.primary.base,
              fontWeight: '600',
            },
            code: {
              color: customColors.primary.base,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25em',
              fontFamily: customFontFamily.mono.join(', '),
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },

  plugins: [
    typography(), // Tailwind Typography plugin for styled prose
    forms({ strategy: 'class' }), // Tailwind Forms plugin for styled forms
  ],
};

// Debugging output
console.log("Tailwind Config Debug:");
console.log("Content Paths:", config.content);
console.log("Safelist:", config.safelist);
console.log("Theme Colors:", config.theme.extend.colors);
console.log("Custom Font Family:", config.theme.extend.fontFamily);


export default config;
