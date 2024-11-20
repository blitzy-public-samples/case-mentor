// @testing-library/jest-dom v6.1.0
import '@testing-library/jest-dom';

// jest-environment-jsdom v29.7.0
import 'jest-environment-jsdom';

// whatwg-fetch v3.6.0
import 'whatwg-fetch';

// msw v1.3.0
import { afterAll, afterEach, beforeAll } from '@jest/globals';

/*
Human Tasks:
1. Ensure Node.js version 18.0+ is installed for compatibility
2. Configure IDE Jest test runner settings
3. Add test coverage thresholds to package.json if not present
4. Set up MSW handlers in a separate mocks directory
5. Configure source maps for accurate test coverage reporting
*/

// Addresses requirement: Testing Environment - Setup for Jest testing framework with React Testing Library integration
beforeAll(() => {
  // Mock window.matchMedia for components using media queries
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

// Addresses requirement: UI Component Testing - Setup for testing UI components with React Testing Library
const mockResizeObserver = (): void => {
  // Mock implementation for components using viewport measurements
  global.ResizeObserver = class ResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  };
};

// Addresses requirement: UI Component Testing - Setup for testing UI components with React Testing Library
const mockIntersectionObserver = (): void => {
  // Mock implementation for components with infinite scroll or lazy loading
  global.IntersectionObserver = class IntersectionObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
  };
};

// Initialize mocks before tests
mockResizeObserver();
mockIntersectionObserver();

// Addresses requirement: System Testing - Configuration for API endpoint testing and mocking
afterEach(() => {
  // Clean up any pending requests after each test
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Additional Jest configuration for DOM environment
Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});

// Polyfill for TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock console.error to fail tests on React warnings
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    throw new Error('React warning: Component update not wrapped in act(...)');
  }
  originalError.call(console, ...args);
};

// Extend Jest matchers for DOM assertions
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => pass
        ? `Expected element not to be in the document`
        : `Expected element to be in the document`,
    };
  },
  toHaveAttribute: (received, name, value) => {
    const pass = received.hasAttribute(name) && 
                 (!value || received.getAttribute(name) === value);
    return {
      pass,
      message: () => pass
        ? `Expected element not to have attribute "${name}"`
        : `Expected element to have attribute "${name}"`,
    };
  }
});

// Configure default test timeout
jest.setTimeout(10000);

// Export global types for test files
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(name: string, value?: string): R;
    }
  }
}