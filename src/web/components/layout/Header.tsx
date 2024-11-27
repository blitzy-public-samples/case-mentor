// Third-party imports
import React from 'react'; // ^18.0.0
import Link from 'next/link'; // ^13.0.0
import Image from 'next/image'; // ^13.0.0

// Internal imports
import { Button } from '../shared/Button';
import { Avatar } from '../shared/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

// Import the logo from `assets/images`
import Logos from '../../../assets/images/logo.png';

const NAVIGATION_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', requiresAuth: true },
  { label: 'Drills', href: '/drills', requiresAuth: true },
  { label: 'Simulation', href: '/simulation', requiresAuth: true },
] as const;

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const { state: authState, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={`
        w-full h-16 px-4 md:px-6 
        bg-white dark:bg-gray-900 
        border-b border-gray-200 dark:border-gray-800
        shadow-sm
        fixed top-0 z-50
        ${className}
      `}
      role="banner"
      aria-label="Main navigation"
    >
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Platform Name */}
        <Link href="/" className="flex items-center space-x-2" aria-label="McKinsey Prep Platform">
          <Image
            src={Logos} // Use the imported logo
            alt="McKinsey Prep Logo"
            width={32}
            height={32}
            priority
          />
          <span className="text-lg font-semibold text-gray-900 dark:text-white hidden md:block">
            McKinsey Prep
          </span>
        </Link>

        {/* Main Navigation */}
        <nav className="hidden md:flex items-center space-x-6" role="navigation">
          {NAVIGATION_ITEMS.map((item) => (
            (!item.requiresAuth || authState.authenticated) && (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white
                          transition-colors duration-200"
                aria-current={location.pathname === item.href ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </Button>

          {/* Auth Controls */}
          {authState.authenticated && authState.session ? (
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="flex items-center space-x-2" aria-label="View profile">
                <Avatar size="sm" profile={authState.session.profile} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                  {authState.session.profile.firstName}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
