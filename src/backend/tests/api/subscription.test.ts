// @package jest ^29.0.0
// @package supertest ^6.0.0
// @package stripe-mock ^2.0.0

import { describe, expect, jest, beforeEach, afterEach, it } from '@jest/globals';
import supertest from 'supertest';
import { SubscriptionService } from '../../services/SubscriptionService';
import { APIError } from '../../lib/errors/APIError';
import { SubscriptionPlan, Subscription } from '../../types/subscription';

// Mock SubscriptionService
jest.mock('../../services/SubscriptionService');

// Mock test data
const testUser = { id: 'test-user-id', email: 'test@example.com' };
const testPlan = { id: 'test-plan-id', name: 'Premium', priceMonthly: 49.99, stripeProductId: 'prod_test123' };

// Initialize test app and request
const app = require('../../app'); // Assuming app.ts exports the Express app
const request = supertest(app);

describe('POST /api/subscription/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Requirement: Subscription System - Payment processing integration
  it('should create a new subscription with valid plan and payment method', async () => {
    const mockSubscription: Subscription = {
      id: 'sub_123',
      userId: testUser.id,
      planId: testPlan.id,
      status: 'ACTIVE',
      stripeSubscriptionId: 'sub_stripe123',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123'
    };

    (SubscriptionService.prototype.createSubscription as jest.Mock).mockResolvedValue(mockSubscription);

    const response = await request
      .post('/api/subscription/create')
      .send({
        planId: testPlan.id,
        paymentMethodId: 'pm_123'
      })
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: mockSubscription.id,
      status: 'ACTIVE'
    });
  });

  // Requirement: Payment Processing - Error handling
  it('should handle missing payment method error', async () => {
    const response = await request
      .post('/api/subscription/create')
      .send({
        planId: testPlan.id
      })
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Requirement: Subscription System - Validation
  it('should handle invalid plan ID error', async () => {
    const response = await request
      .post('/api/subscription/create')
      .send({
        planId: 'invalid-plan',
        paymentMethodId: 'pm_123'
      })
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Requirement: Payment Processing - Stripe integration
  it('should handle Stripe payment failure', async () => {
    (SubscriptionService.prototype.createSubscription as jest.Mock).mockRejectedValue(
      new APIError('PAYMENT_FAILED', 'Payment processing failed')
    );

    const response = await request
      .post('/api/subscription/create')
      .send({
        planId: testPlan.id,
        paymentMethodId: 'pm_123'
      })
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('PAYMENT_FAILED');
  });
});

describe('PATCH /api/subscription/[id]', () => {
  const subscriptionId = 'sub_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Requirement: Subscription System - Plan updates
  it('should successfully update subscription plan', async () => {
    const mockUpdatedSubscription: Subscription = {
      id: subscriptionId,
      userId: testUser.id,
      planId: 'new-plan-id',
      status: 'ACTIVE',
      stripeSubscriptionId: 'sub_stripe123',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'cus_123'
    };

    (SubscriptionService.prototype.updateSubscription as jest.Mock).mockResolvedValue(mockUpdatedSubscription);

    const response = await request
      .patch(`/api/subscription/${subscriptionId}`)
      .send({
        planId: 'new-plan-id'
      })
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(response.body.data.planId).toBe('new-plan-id');
  });

  // Requirement: Subscription System - Error handling
  it('should handle invalid subscription ID', async () => {
    (SubscriptionService.prototype.updateSubscription as jest.Mock).mockRejectedValue(
      new APIError('NOT_FOUND', 'Subscription not found')
    );

    const response = await request
      .patch(`/api/subscription/invalid-id`)
      .send({
        planId: 'new-plan-id'
      })
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('DELETE /api/subscription/[id]', () => {
  const subscriptionId = 'sub_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Requirement: Subscription System - Cancellation
  it('should successfully cancel subscription', async () => {
    (SubscriptionService.prototype.cancelSubscription as jest.Mock).mockResolvedValue(undefined);

    const response = await request
      .delete(`/api/subscription/${subscriptionId}`)
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
  });

  // Requirement: Subscription System - Immediate cancellation
  it('should handle immediate cancellation', async () => {
    (SubscriptionService.prototype.cancelSubscription as jest.Mock).mockResolvedValue(undefined);

    const response = await request
      .delete(`/api/subscription/${subscriptionId}`)
      .query({ immediately: true })
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(SubscriptionService.prototype.cancelSubscription).toHaveBeenCalledWith(subscriptionId, true);
  });
});

describe('POST /api/subscription/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Requirement: Payment Processing - Webhook handling
  it('should handle successful payment webhook event', async () => {
    const webhookEvent = {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_123',
          customer: 'cus_123'
        }
      }
    };

    const response = await request
      .post('/api/subscription/webhook')
      .send(webhookEvent)
      .set('Stripe-Signature', 'test-signature');

    expect(response.status).toBe(200);
  });

  // Requirement: Payment Processing - Error handling
  it('should handle invalid webhook signature', async () => {
    const response = await request
      .post('/api/subscription/webhook')
      .send({})
      .set('Stripe-Signature', 'invalid-signature');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Requirement: Subscription System - Status updates
  it('should handle subscription cancelled webhook event', async () => {
    const webhookEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123'
        }
      }
    };

    const response = await request
      .post('/api/subscription/webhook')
      .send(webhookEvent)
      .set('Stripe-Signature', 'test-signature');

    expect(response.status).toBe(200);
  });
});