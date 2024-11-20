// Third-party imports
import React from 'react'; // ^18.0.0
import { Metadata } from 'next'; // ^13.0.0

// Internal imports
import { Avatar } from '../../components/shared/Avatar';
import { Card } from '../../components/shared/Card';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../config/theme';
import { PROFILE_SECTIONS, SKILL_CATEGORIES } from '../../config/constants';

/**
 * Human Tasks:
 * 1. Verify proper image optimization settings in next.config.js for avatar images
 * 2. Test keyboard navigation flow across all profile sections
 * 3. Validate color contrast ratios meet WCAG 2.1 AA standards
 * 4. Ensure proper error handling for subscription status updates
 */

// Requirement: User Interface Design - Profile page metadata
export const generateMetadata = (): Metadata => {
  return {
    title: 'Profile | Case Interview Practice Platform',
    description: 'Manage your profile settings, subscription, and practice history',
    robots: {
      index: false,
      follow: false
    }
  };
};

// Requirement: User Interface Design - Profile statistics interface
interface ProfileStats {
  totalDrills: number;
  averageScore: number;
  completedSimulations: number;
  skillProgress: Record<string, number>;
}

// Requirement: User Interface Design - Profile page component
const ProfilePage: React.FC = () => {
  const { state } = useAuth();
  const { user, profile } = state.session || {};

  // Requirement: User Interface Design - Mock statistics for development
  const stats: ProfileStats = {
    totalDrills: 24,
    averageScore: 85,
    completedSimulations: 3,
    skillProgress: {
      'Case Math': 75,
      'Market Sizing': 80,
      'Brainstorming': 65,
      'Synthesis': 70
    }
  };

  // Requirement: Accessibility Requirements - Profile header with proper ARIA labels
  const renderProfileHeader = () => (
    <div 
      className="flex items-center gap-4 mb-6"
      role="banner"
      aria-label="Profile header"
    >
      <Avatar
        size="lg"
        profile={profile}
        className="border-2 border-secondary-base"
      />
      <div>
        <h1 className="text-2xl font-semibold text-primary-base">
          {profile?.firstName} {profile?.lastName}
        </h1>
        <p className="text-gray-600">{user?.email}</p>
      </div>
    </div>
  );

  // Requirement: User Interface Design - Personal information section
  const renderPersonalInfo = () => (
    <Card
      shadow="md"
      padding="lg"
      className="mb-6"
      aria-labelledby="personal-info-heading"
    >
      <h2 
        id="personal-info-heading" 
        className="text-xl font-semibold mb-4"
      >
        Personal Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">Target Firm</label>
          <p className="mt-1">{profile?.targetFirm || 'Not specified'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Interview Date</label>
          <p className="mt-1">
            {profile?.interviewDate 
              ? new Date(profile.interviewDate).toLocaleDateString() 
              : 'Not scheduled'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Preparation Level</label>
          <p className="mt-1">{profile?.preparationLevel || 'Not assessed'}</p>
        </div>
      </div>
    </Card>
  );

  // Requirement: User Interface Design - Subscription details section
  const renderSubscription = () => (
    <Card
      shadow="md"
      padding="lg"
      className="mb-6"
      aria-labelledby="subscription-heading"
    >
      <h2 
        id="subscription-heading" 
        className="text-xl font-semibold mb-4"
      >
        Subscription
      </h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600">Current Plan</label>
          <p className="mt-1 text-lg font-medium text-primary-base">
            {user?.subscriptionTier || 'FREE'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Status</label>
          <p className="mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
              ${user?.subscriptionStatus === 'ACTIVE' 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }`}
            >
              {user?.subscriptionStatus || 'INACTIVE'}
            </span>
          </p>
        </div>
      </div>
    </Card>
  );

  // Requirement: User Interface Design - Practice history section
  const renderPracticeHistory = () => (
    <Card
      shadow="md"
      padding="lg"
      className="mb-6"
      aria-labelledby="practice-history-heading"
    >
      <h2 
        id="practice-history-heading" 
        className="text-xl font-semibold mb-4"
      >
        Practice History
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Drills</p>
          <p className="text-2xl font-semibold">{stats.totalDrills}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Average Score</p>
          <p className="text-2xl font-semibold">{stats.averageScore}%</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Simulations</p>
          <p className="text-2xl font-semibold">{stats.completedSimulations}</p>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-4">Skill Progress</h3>
        <div className="space-y-4">
          {Object.entries(stats.skillProgress).map(([skill, progress]) => (
            <div key={skill}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">{skill}</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-secondary-base rounded-full h-2"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  // Requirement: Accessibility Requirements - Loading state
  if (!state.session) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {renderProfileHeader()}
        {renderPersonalInfo()}
        {renderSubscription()}
        {renderPracticeHistory()}
      </div>
    </div>
  );
};

export default ProfilePage;