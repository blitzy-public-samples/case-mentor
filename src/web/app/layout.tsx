// Remove 'use client' from this file

// react v18.0.0
import React from 'react';
// next v13.4.0
import { Inter, Roboto_Mono } from 'next/font/google';
import { Metadata } from 'next';

// Internal imports
import './globals.css';
import { ThemeProvider } from '../providers/ThemeProvider';
import ToastProvider from '../providers/ToastProvider';
import { AuthProvider } from '../providers/AuthProvider';

/**
 * Human Tasks:
 * 1. Verify font loading performance in production environment
 * 2. Test color contrast ratios for WCAG 2.1 AA compliance
 * 3. Validate HTML semantics with accessibility tools
 * 4. Monitor client-side performance metrics
 */

// Requirement: Design System Implementation - Font configuration
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans'
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono'
});

// Metadata configuration moved to its own Server Component
export const generateMetadata = (): Metadata => {
  return {
    title: 'McKinsey Case Interview Practice Platform',
    description: 'Practice consulting case interviews with real-time feedback and professional guidance',
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      userScalable: true
    },
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
      { media: '(prefers-color-scheme: dark)', color: '#0F172A' }
    ],
    openGraph: {
      type: 'website',
      title: 'McKinsey Case Interview Practice Platform',
      description: 'Practice consulting case interviews with real-time feedback and professional guidance',
      siteName: 'McKinsey Prep',
      url: process.env.NEXT_PUBLIC_APP_URL
    },
    manifest: '/manifest.json',
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png'
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'McKinsey Prep'
    }
  };
};

// Root layout component
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="color-scheme" content="light dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <a 
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:text-primary"
              >
                Skip to main content
              </a>
              <main id="main-content" className="min-h-screen bg-background text-foreground">
                {children}
              </main>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
