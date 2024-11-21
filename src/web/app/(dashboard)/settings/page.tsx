'use client';

// Third-party imports
import React, { useEffect } from 'react'; // ^18.0.0
import { useForm } from 'react-hook-form'; // ^7.0.0

// Internal imports
import { buttonVariants } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useAuth } from '@/hooks/useAuth';
import { useToast, ToastType } from '@/hooks/useToast';

// Requirement: User Management - Profile customization and user preferences management
interface ProfileFormData {
  name: string;
  email: string;
  avatar?: string;
}

// Requirement: User Management - Notification preferences configuration
interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
}

/**
 * Human Tasks:
 * 1. Verify ARIA labels and roles with screen reader testing
 * 2. Test keyboard navigation flow across all form elements
 * 3. Validate color contrast ratios for all text elements
 * 4. Test form validation feedback with screen readers
 * 5. Verify toast notifications are properly announced
 */

// Requirement: User Management - Settings page component implementation
const SettingsPage: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const { show: showToast } = useToast();

  // Initialize form with react-hook-form
  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue: setProfileValue
  } = useForm<ProfileFormData>();

  const {
    register: notificationRegister,
    handleSubmit: handleNotificationSubmit,
    formState: { errors: notificationErrors },
    setValue: setNotificationValue
  } = useForm<NotificationSettings>();

  // Set initial form values from auth state
  useEffect(() => {
    if (authState.user && authState.session?.profile) {
      setProfileValue('name', authState.session.profile.firstName + ' ' + authState.session.profile.lastName);
      setProfileValue('email', authState.user.email);
      setProfileValue('avatar', authState.session.profile.avatarUrl || '');

      // Set notification preferences
      setNotificationValue('emailNotifications', true); // Default value
      setNotificationValue('pushNotifications', true); // Default value
    }
  }, [authState, setProfileValue, setNotificationValue]);

  // Requirement: User Management - Profile update handler
  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      // API call would go here
      showToast({
        type: ToastType.SUCCESS,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      showToast({
        type: ToastType.ERROR,
        message: 'Failed to update profile'
      });
    }
  };

  // Requirement: User Management - Notification preferences update handler
  const handleNotificationUpdate = async (data: NotificationSettings) => {
    try {
      // API call would go here
      showToast({
        type: ToastType.SUCCESS,
        message: 'Notification preferences updated'
      });
    } catch (error) {
      showToast({
        type: ToastType.ERROR,
        message: 'Failed to update notification preferences'
      });
    }
  };

  // Requirement: Accessibility Requirements - WCAG 2.1 AA compliant settings interface
  return (
    <div className="container mx-auto px-4 py-8 space-y-8" role="main">
      <h1 className="text-3xl font-bold mb-8" id="settings-title">
        Account Settings
      </h1>

      {/* Profile Settings Section */}
      <Card className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
        <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                {...profileRegister('name', { required: 'Name is required' })}
                className="w-full p-2 border rounded-md"
                aria-describedby={profileErrors.name ? 'name-error' : undefined}
              />
              {profileErrors.name && (
                <p id="name-error" className="text-red-500 text-sm mt-1" role="alert">
                  {profileErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...profileRegister('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full p-2 border rounded-md"
                aria-describedby={profileErrors.email ? 'email-error' : undefined}
              />
              {profileErrors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">
                  {profileErrors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium mb-1">
                Avatar URL
              </label>
              <input
                id="avatar"
                type="url"
                {...profileRegister('avatar')}
                className="w-full p-2 border rounded-md"
                aria-describedby={profileErrors.avatar ? 'avatar-error' : undefined}
              />
              {profileErrors.avatar && (
                <p id="avatar-error" className="text-red-500 text-sm mt-1" role="alert">
                  {profileErrors.avatar.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={buttonVariants({ variant: 'primary' })}
            aria-label="Update profile information"
          >
            Save Profile Changes
          </button>
        </form>
      </Card>

      {/* Notification Settings Section */}
      <Card className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Notification Preferences</h2>
        <form onSubmit={handleNotificationSubmit(handleNotificationUpdate)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="emailNotifications"
                type="checkbox"
                {...notificationRegister('emailNotifications')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm">
                Email Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="pushNotifications"
                type="checkbox"
                {...notificationRegister('pushNotifications')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="pushNotifications" className="ml-2 block text-sm">
                Push Notifications
              </label>
            </div>
          </div>

          <button
            type="submit"
            className={buttonVariants({ variant: 'primary' })}
            aria-label="Update notification preferences"
          >
            Save Notification Settings
          </button>
        </form>
      </Card>

      {/* Account Actions Section */}
      <Card>
        <h2 className="text-2xl font-semibold mb-6">Account Actions</h2>
        <div className="space-y-4">
          <button
            onClick={() => logout()}
            className={buttonVariants({ variant: 'secondary' })}
            aria-label="Sign out of your account"
          >
            Sign Out
          </button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;