// @jest/globals ^29.0.0
// resend ^1.0.0
import { jest, describe, test, beforeEach, afterEach, expect } from '@jest/globals';
import { Resend } from 'resend';
import { 
  sendEmail, 
  sendFeedbackEmail, 
  sendWelcomeEmail,
  EMAIL_RATE_LIMITS 
} from '../../lib/email';
import { 
  generateDrillFeedbackEmail, 
  generateSimulationFeedbackEmail 
} from '../../lib/email/templates/feedback';
import { emailConfig } from '../../config/email';

/**
 * Human Tasks:
 * 1. Configure Jest environment with proper timezone settings for date-based tests
 * 2. Set up test environment variables for Resend API key and email configuration
 * 3. Configure test coverage thresholds for email service tests
 * 4. Set up email template test fixtures with representative test data
 */

// Mock Resend client
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn()
    }
  }))
}));

// Mock email template generation functions
jest.mock('../../lib/email/templates/feedback', () => ({
  generateDrillFeedbackEmail: jest.fn(),
  generateSimulationFeedbackEmail: jest.fn()
}));

describe('Email Service', () => {
  let mockResendClient: jest.Mocked<Resend>;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Initialize mock Resend client
    mockResendClient = new Resend('test_api_key') as jest.Mocked<Resend>;
    mockResendClient.emails.send = jest.fn().mockResolvedValue({
      data: { id: 'test_email_id' },
      error: null
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Requirement: Email Communications - Integration with Resend for transactional emails
  test('sendEmail sends email successfully', async () => {
    const mockEmailOptions = {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>'
    };

    // Configure mock response
    mockResendClient.emails.send.mockResolvedValueOnce({
      data: { id: 'test_email_id' },
      error: null
    });

    const result = await sendEmail(mockEmailOptions);

    expect(result).toBe(true);
    expect(mockResendClient.emails.send).toHaveBeenCalledWith({
      from: emailConfig.fromAddress,
      ...mockEmailOptions,
      tags: [{ name: 'email_type', value: 'general' }]
    });
  });

  // Requirement: User Management - Email notifications for feedback delivery
  test('sendFeedbackEmail generates and sends drill feedback', async () => {
    const mockFeedback = {
      content: 'Test feedback',
      score: 85,
      metrics: {
        clarity: 90,
        structure: 80,
        analysis: 85
      }
    };

    const mockHtmlContent = '<div>Mock Drill Feedback</div>';
    (generateDrillFeedbackEmail as jest.Mock).mockReturnValue(mockHtmlContent);

    const result = await sendFeedbackEmail(
      mockFeedback,
      'test@example.com',
      'Test User',
      'Market Sizing'
    );

    expect(result).toBe(true);
    expect(generateDrillFeedbackEmail).toHaveBeenCalledWith(
      mockFeedback,
      'Test User',
      'Market Sizing'
    );
    expect(mockResendClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Your Market Sizing Practice Feedback',
        html: mockHtmlContent,
        tags: [
          { name: 'email_type', value: 'feedback' },
          { name: 'feedback_type', value: 'drill' }
        ]
      })
    );
  });

  // Requirement: User Management - Email notifications for feedback delivery
  test('sendFeedbackEmail generates and sends simulation feedback', async () => {
    const mockFeedback = {
      content: 'Test feedback',
      score: 90,
      metrics: {
        problemSolving: 92,
        communication: 88,
        analysis: 90
      }
    };

    const mockHtmlContent = '<div>Mock Simulation Feedback</div>';
    (generateSimulationFeedbackEmail as jest.Mock).mockReturnValue(mockHtmlContent);

    const result = await sendFeedbackEmail(
      mockFeedback,
      'test@example.com',
      'Test User'
    );

    expect(result).toBe(true);
    expect(generateSimulationFeedbackEmail).toHaveBeenCalledWith(
      mockFeedback,
      'Test User'
    );
    expect(mockResendClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Your McKinsey Simulation Results',
        html: mockHtmlContent,
        tags: [
          { name: 'email_type', value: 'feedback' },
          { name: 'feedback_type', value: 'simulation' }
        ]
      })
    );
  });

  // Requirement: User Management - Email notifications for user management
  test('sendWelcomeEmail sends welcome email to new user', async () => {
    const mockUser = {
      email: 'test@example.com',
      name: 'Test User',
      verificationToken: 'test_token',
      subscription: {
        tier: 'premium'
      }
    };

    const result = await sendWelcomeEmail(mockUser);

    expect(result).toBe(true);
    expect(mockResendClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockUser.email,
        subject: 'Welcome to Case Interview Practice!',
        template: emailConfig.templates.welcome,
        data: {
          userName: mockUser.name,
          userEmail: mockUser.email,
          subscriptionTier: mockUser.subscription.tier,
          verificationLink: expect.stringContaining(mockUser.verificationToken)
        },
        tags: [
          { name: 'email_type', value: 'welcome' },
          { name: 'user_tier', value: 'premium' }
        ]
      })
    );
  });

  // Requirement: Email Communications - Rate limiting and error handling
  test('email rate limiting prevents excessive sends', async () => {
    const mockEmailOptions = {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>'
    };

    // Attempt to send more emails than the rate limit allows
    const attempts = EMAIL_RATE_LIMITS.GENERAL + 1;
    const results = await Promise.all(
      Array(attempts).fill(null).map(() => sendEmail(mockEmailOptions))
    );

    // Verify rate limiting
    const successfulSends = results.filter(result => result === true).length;
    expect(successfulSends).toBeLessThanOrEqual(EMAIL_RATE_LIMITS.GENERAL);
    
    // Verify excess attempts were blocked
    const failedSends = results.filter(result => result === false).length;
    expect(failedSends).toBeGreaterThan(0);
    
    // Verify send attempts
    expect(mockResendClient.emails.send).toHaveBeenCalledTimes(EMAIL_RATE_LIMITS.GENERAL);
  });
});