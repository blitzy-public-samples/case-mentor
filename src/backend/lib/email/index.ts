// @package resend ^1.0.0

import { Resend } from 'resend';
import { 
  generateDrillFeedbackEmail, 
  generateSimulationFeedbackEmail 
} from './templates/feedback';
import { sendWelcomeEmail } from './templates/welcome';
import { emailConfig } from '../../config/email';
import { Feedback } from '../../models/Feedback';

/**
 * Human Tasks:
 * 1. Set up Resend API key in environment variables
 * 2. Configure email domain verification in Resend dashboard
 * 3. Set up email monitoring and analytics in Resend dashboard
 * 4. Review and adjust rate limiting thresholds based on usage patterns
 * 5. Configure email bounce and complaint handling
 */

// Requirement: Email Communications - Rate limits for different email types
export const EMAIL_RATE_LIMITS = {
  WELCOME: 1,    // Limit welcome emails to prevent abuse
  FEEDBACK: 10,  // Higher limit for feedback emails
  GENERAL: 5     // Default limit for general emails
} as const;

// Requirement: Email Communications - Configuration options for sending emails
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Generic email sending function using Resend service with rate limiting
 * Requirement: Email Communications - Integration with Resend for transactional emails
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Validate required fields
    if (!options.to || !options.subject || !options.html) {
      throw new Error('Missing required email fields');
    }

    // Initialize Resend client
    const resend = new Resend(emailConfig.apiKey);

    // Prepare email data with default from address
    const emailData = {
      from: emailConfig.fromAddress,
      ...options,
      tags: [{ name: 'email_type', value: 'general' }]
    };

    // Send email using Resend
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('Email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Sends feedback email for drill or simulation attempts with appropriate template
 * Requirement: User Management - Email notifications for user management and feedback delivery
 */
export async function sendFeedbackEmail(
  feedback: Feedback,
  userEmail: string,
  userName: string,
  drillType?: string
): Promise<boolean> {
  try {
    // Generate appropriate email content based on feedback type
    const emailContent = drillType
      ? generateDrillFeedbackEmail(feedback, userName, drillType)
      : generateSimulationFeedbackEmail(feedback, userName);

    // Prepare email options
    const emailOptions: EmailOptions = {
      to: userEmail,
      subject: drillType
        ? `Your ${drillType} Practice Feedback`
        : 'Your McKinsey Simulation Results',
      html: emailContent,
      tags: [
        { name: 'email_type', value: 'feedback' },
        { name: 'feedback_type', value: drillType ? 'drill' : 'simulation' }
      ]
    };

    // Send email with rate limiting
    return await sendEmail(emailOptions);
  } catch (error) {
    console.error('Error sending feedback email:', error);
    return false;
  }
}

// Re-export welcome email functionality
export { sendWelcomeEmail };