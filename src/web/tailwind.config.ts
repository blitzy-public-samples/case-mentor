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
    light: '#93C5FD',   // Light variant
  },
  secondary: {
    DEFAULT: '#9333EA', // Default secondary color
    base: '#9333EA',    // Explicit base color
    hover: '#7E22CE',   // Hover color
    dark: '#6B21A8',    // Darker shade
    light: '#C084FC',   // Light variant
  },
  'bg-background': '#FFFFFF', // Background color
  'text-card-foreground': '#374151', // Text color for cards
  'border-input': '#D1D5DB', // Border input color
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

const config: Config = {
  mode: 'jit', // Enable Just-In-Time (JIT) mode
  content: [
    './pages/**/*.{js,ts,jsx,tsx}', // Include all files in `pages`
    './components/**/*.{js,ts,jsx,tsx}', // Include all files in `components`
    './styles/**/*.css', // Include all styles
  ],
  darkMode: 'class', // Enable dark mode with class

  safelist: [
    'text-primary',
    'hover:text-primary',
    'text-primary-400',
    'text-primary-600',
    'hover:text-primary-700',
    'border-input', // Explicitly safelist `border-input`
    'bg-background', // Safelist background color
    'text-card-foreground', // Safelist card text color
    'animate-fade-in', // Safelist animations
    'focus:ring-primary-light', // Safelist focus styles
    'focus:ring-secondary-light', // Safelist secondary focus
  ],

  theme: {
    extend: {
      colors: customColors, // Apply custom colors
      fontFamily: customFontFamily, // Extend fonts
      spacing: customSpacing, // Extend spacing
      screens: {
        ...customBreakpoints,
      },
      boxShadow: customShadows, // Add shadows
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
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.4s ease-in-out',
        'scale-in': 'scaleIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },

  plugins: [
    typography(), // Tailwind Typography plugin
    forms(), // Tailwind Forms plugin
  ],
};

export default config;
