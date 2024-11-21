/**
 * Human Tasks:
 * 1. Create welcome email template in Resend dashboard with ID 'tmpl_welcome'
 * 2. Configure template variables in Resend: {{userName}}, {{userEmail}}, {{subscriptionTier}}, {{verificationLink}}
 * 3. Design and style the HTML template in Resend dashboard
 * 4. Test template rendering with sample data before production use
 * 5. Set up email delivery monitoring for welcome emails
 */

// Requirement: Email Communications (5.1 High-Level Architecture)
// Integration with Resend for sending transactional emails
// Version: ^1.0.0
import { Resend } from 'resend';

// Requirement: User Management (3. SCOPE/Core Features/User Management)
// Email configuration for user onboarding notifications
import { emailConfig } from '../../../config/email';

/**
 * Interface defining the data structure for welcome email template variables
 * Requirement: User Management (3. SCOPE/Core Features/User Management)
 */
export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  subscriptionTier?: string;
  verificationLink: string;
}

/**
 * Generates HTML content for welcome email using user data and predefined template
 * Requirement: Email Communications (5.1 High-Level Architecture)
 */
function generateWelcomeEmailContent(user: any): string {
  const welcomeData: WelcomeEmailData = {
    userName: user.name || user.email.split('@')[0],
    userEmail: user.email,
    subscriptionTier: user.subscription?.tier,
    verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${user.verificationToken}`
  };

  // Generate HTML content with user-specific data
  const content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome to Case Interview Practice!</h1>
      <p>Hello ${welcomeData.userName},</p>
      <p>Thank you for joining our platform. We're excited to help you prepare for your case interviews!</p>
      
      ${welcomeData.subscriptionTier ? `
        <p>You're currently on our ${welcomeData.subscriptionTier} plan. Here's what you have access to:</p>
        <ul>
          ${welcomeData.subscriptionTier === 'premium' ? `
            <li>Unlimited practice cases</li>
            <li>AI-powered feedback</li>
            <li>Live coaching sessions</li>
            <li>Premium study materials</li>
          ` : `
            <li>Basic practice cases</li>
            <li>Essential study materials</li>
          `}
        </ul>
      ` : ''}

      <p>To get started:</p>
      <ol>
        <li>Verify your email address by clicking <a href="${welcomeData.verificationLink}">here</a></li>
        <li>Complete your profile</li>
        <li>Browse our case library</li>
        <li>Start practicing!</li>
      </ol>

      <p>If you have any questions, our support team is here to help.</p>
      <p>Best regards,<br>The Case Interview Practice Team</p>
    </div>
  `;

  return content;
}

/**
 * Sends rate-limited welcome email to newly registered users using Resend template
 * Requirement: User Management (3. SCOPE/Core Features/User Management)
 * Requirement: Email Communications (5.1 High-Level Architecture)
 */
export async function sendWelcomeEmail(user: any): Promise<boolean> {
  try {
    // Generate welcome email content
    const emailContent = generateWelcomeEmailContent(user);

    // Prepare email options
    const emailOptions = {
      from: emailConfig.fromAddress,
      to: user.email,
      subject: 'Welcome to Case Interview Practice!',
      html: emailContent,
      tags: [
        { name: 'email_type', value: 'welcome' },
        { name: 'user_tier', value: user.subscription?.tier || 'free' }
      ],
      template: emailConfig.templates.welcome,
      data: {
        userName: user.name || user.email.split('@')[0],
        userEmail: user.email,
        subscriptionTier: user.subscription?.tier,
        verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${user.verificationToken}`
      }
    };

    // Send email using Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send(emailOptions);

    if (!response.id) {
      console.error('Failed to send welcome email: No response ID received');
      return false;
    }

    console.log('Welcome email sent successfully:', response.id);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}