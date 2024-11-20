/**
 * Human Tasks:
 * 1. Set up Resend API key in environment variables as RESEND_API_KEY
 * 2. Verify email domain verification in Resend dashboard for the fromAddress
 * 3. Create and configure email templates in Resend dashboard matching the template IDs
 * 4. Set up email domain SPF and DKIM records for improved deliverability
 * 5. Configure email sending alerts and monitoring in Resend dashboard
 */

// Requirement: Email Communications (5.1 High-Level Architecture)
// Resend email service client for sending transactional emails
// Version: ^1.0.0
import { Resend } from 'resend';
import { EmailConfig } from '../types/config';

// Email template IDs for different types of communications
export const EMAIL_TEMPLATES = {
  WELCOME: 'tmpl_welcome',
  DRILL_FEEDBACK: 'tmpl_drill_feedback',
  SIMULATION_FEEDBACK: 'tmpl_simulation_feedback',
  PASSWORD_RESET: 'tmpl_password_reset',
  SUBSCRIPTION_CONFIRMATION: 'tmpl_subscription'
} as const;

// Default sender address for all system communications
export const DEFAULT_FROM_ADDRESS = 'noreply@caseinterviewpractice.com';

// Rate limits for different types of emails (emails per minute)
export const EMAIL_RATE_LIMITS = {
  WELCOME: 1,        // Limit welcome emails to prevent abuse
  FEEDBACK: 10,      // Higher limit for feedback emails
  MARKETING: 5       // Moderate limit for marketing communications
} as const;

/**
 * Validates email configuration settings
 * Requirement: Email Communications (5.1 High-Level Architecture)
 */
export const validateEmailConfig = (config: EmailConfig): boolean => {
  // Verify API key exists and is non-empty
  if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim() === '') {
    return false;
  }

  // Validate email format for fromAddress
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!config.fromAddress || !emailRegex.test(config.fromAddress)) {
    return false;
  }

  // Verify all required templates exist
  const requiredTemplates = Object.values(EMAIL_TEMPLATES);
  const configuredTemplates = Object.values(config.templates);
  
  if (!requiredTemplates.every(template => configuredTemplates.includes(template))) {
    return false;
  }

  // Validate template ID format (must start with tmpl_)
  const templateIdRegex = /^tmpl_[a-zA-Z0-9_]+$/;
  if (!configuredTemplates.every(template => templateIdRegex.test(template))) {
    return false;
  }

  return true;
};

// Requirement: User Management (3. SCOPE/Core Features/User Management)
// Email configuration implementation
export const emailConfig: EmailConfig = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromAddress: DEFAULT_FROM_ADDRESS,
  templates: {
    welcome: EMAIL_TEMPLATES.WELCOME,
    drillFeedback: EMAIL_TEMPLATES.DRILL_FEEDBACK,
    simulationFeedback: EMAIL_TEMPLATES.SIMULATION_FEEDBACK,
    passwordReset: EMAIL_TEMPLATES.PASSWORD_RESET,
    subscriptionConfirmation: EMAIL_TEMPLATES.SUBSCRIPTION_CONFIRMATION
  }
};

// Validate configuration before creating client
if (!validateEmailConfig(emailConfig)) {
  throw new Error('Invalid email configuration. Please check environment variables and template settings.');
}

// Initialize Resend client with validated configuration
// Requirement: Email Communications (5.1 High-Level Architecture)
export const resendClient = new Resend(emailConfig.apiKey);