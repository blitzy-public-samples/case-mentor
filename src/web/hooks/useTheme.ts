// react v18.0.0
import { useState, useEffect, useCallback } from 'react';
import { colors } from '../config/theme';

/**
 * Human Tasks:
 * 1. Verify that the CSS variables for theme colors are properly set up in the global stylesheet
 * 2. Test theme persistence across browser sessions and page reloads
 * 3. Verify system preference detection works correctly across different operating systems
 * 4. Ensure smooth theme transitions without visual flicker
 */

// Global constants for theme management
const STORAGE_KEY = 'theme-preference';
const THEME_VALUES = ['light', 'dark'] as const;
type Theme = typeof THEME_VALUES[number];

/**
 * Requirement: Design System Specifications
 * Detects system color scheme preference using media query
 */
const getSystemTheme = (): Theme => {
  // Check if window.matchMedia is available (client-side only)
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

/**
 * Requirement: Design System Specifications, Accessibility Requirements
 * Custom hook for managing theme state with system preference sync and persistence
 */
export const useTheme = () => {
  // Initialize theme state from localStorage or system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme && THEME_VALUES.includes(storedTheme as Theme)) {
      return storedTheme as Theme;
    }
    
    return getSystemTheme();
  });

  // Memoized theme setter with validation and side effects
  const setTheme = useCallback((newTheme: Theme) => {
    if (!THEME_VALUES.includes(newTheme)) {
      console.error(`Invalid theme value: ${newTheme}`);
      return;
    }
    setThemeState(newTheme);
  }, []);

  // Memoized theme toggle function
  const toggleTheme = useCallback(() => {
    setThemeState(currentTheme => 
      currentTheme === 'light' ? 'dark' : 'light'
    );
  }, []);

  // Effect for handling system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const storedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (!storedTheme) {
        setThemeState(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Effect for applying theme changes to document and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update document root class for CSS variable switching
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);

    // Apply WCAG compliant colors based on theme
    Object.entries(colors).forEach(([colorKey, colorValues]) => {
      Object.entries(colorValues).forEach(([variant, value]) => {
        document.documentElement.style.setProperty(
          `--color-${colorKey}-${variant}`,
          value
        );
      });
    });

    // Persist theme preference
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme
  };
};