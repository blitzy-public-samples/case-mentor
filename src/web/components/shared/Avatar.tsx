// Third-party imports
import React from 'react'; // ^18.0.0
import { cn } from 'class-variance-authority'; // ^0.7.0
import Image from 'next/image'; // ^13.0.0

// Internal imports
import { UserProfile } from '../../types/user';
import { theme } from '../../config/theme';

/**
 * Human Tasks:
 * 1. Verify Next.js Image component optimization settings in next.config.js
 * 2. Ensure proper image domains are configured for avatar URLs
 * 3. Test fallback states with various name combinations
 * 4. Validate color contrast for fallback initials against background
 */

// Requirement: User Interface Design - Consistent avatar sizes
const AVATAR_SIZES = {
  sm: '32px',
  md: '40px',
  lg: '48px'
} as const;

// Requirement: User Interface Design - Fallback styling
const FALLBACK_BG_COLOR = theme.colors.secondary.base;

interface AvatarProps {
  size: 'sm' | 'md' | 'lg';
  profile: UserProfile;
  loading?: boolean;
  className?: string;
}

// Requirement: User Interface Design - Extract initials for fallback display
const getInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName.charAt(0);
  const lastInitial = lastName.charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

// Requirement: User Interface Design - Reusable avatar component
export const Avatar: React.FC<AvatarProps> = ({
  size,
  profile,
  loading = false,
  className
}) => {
  const dimensions = AVATAR_SIZES[size];
  const initials = getInitials(profile.firstName, profile.lastName);
  
  // Requirement: Accessibility Requirements - Base styles with ARIA support
  const baseStyles = cn(
    'relative rounded-full overflow-hidden flex items-center justify-center',
    'transition-opacity duration-200',
    {
      'opacity-60': loading,
    },
    className
  );

  // Requirement: Accessibility Requirements - Loading state handling
  if (loading) {
    return (
      <div
        className={baseStyles}
        style={{
          width: dimensions,
          height: dimensions,
          backgroundColor: theme.colors.primary.disabled
        }}
        aria-busy="true"
        role="progressbar"
      />
    );
  }

  // Requirement: User Interface Design - Avatar image display
  if (profile.avatarUrl) {
    return (
      <div
        className={baseStyles}
        style={{
          width: dimensions,
          height: dimensions,
          boxShadow: theme.shadows.sm
        }}
      >
        <Image
          src={profile.avatarUrl}
          alt={`${profile.firstName} ${profile.lastName}'s avatar`}
          width={parseInt(dimensions)}
          height={parseInt(dimensions)}
          className="object-cover"
          priority={size === 'lg'} // Prioritize loading for larger avatars
          aria-label={`${profile.firstName} ${profile.lastName}'s profile picture`}
        />
      </div>
    );
  }

  // Requirement: Accessibility Requirements - Fallback initials display
  return (
    <div
      className={baseStyles}
      style={{
        width: dimensions,
        height: dimensions,
        backgroundColor: FALLBACK_BG_COLOR,
        color: '#FFFFFF', // Ensures WCAG 2.1 AA contrast with background
        fontSize: `${parseInt(dimensions) * 0.4}px`,
        fontWeight: 500,
        boxShadow: theme.shadows.sm
      }}
      aria-label={`${profile.firstName} ${profile.lastName}'s initials`}
      role="img"
    >
      {initials}
    </div>
  );
};