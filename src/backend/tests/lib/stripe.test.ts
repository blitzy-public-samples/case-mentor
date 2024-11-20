// @package jest ^29.0.0
// @package stripe ^12.0.0
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Stripe } from 'stripe';
import {
  createCustomer,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  handleWebhook,
  validateWebhookSignature,
  createPaymentIntent
} from '../../lib/stripe';
import {
  stripeConfig,
  stripeClient,
  SUBSCRIPTION_PRODUCTS,
  WEBHOOK_EVENTS
} from '../../config/stripe';
import { SubscriptionPlan, Subscription } from '../../types/subscription';

/**
 * Human Tasks:
 * 1. Configure test environment variables for Stripe test mode API keys
 * 2. Set up Stripe webhook test endpoints with proper test signing secrets
 * 3. Configure test database for subscription data persistence
 * 4. Set up proper test data cleanup after test execution
 */

// Mock Stripe client
jest.mock('stripe');
const mockStripeClient = stripeClient as jest.Mocked<Stripe>;

describe('Stripe Customer Management', () => {
  // Requirement: Payment Processing - Customer creation and management
  const testCustomer = {
    id: 'cus_test',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a customer successfully with valid data', async () => {
    mockStripeClient.customers.create.mockResolvedValueOnce(testCustomer as Stripe.Customer);

    const customer = await createCustomer(testCustomer.email, testCustomer.name);

    expect(customer.id).toBe(testCustomer.id);
    expect(customer.email).toBe(testCustomer.email);
    expect(mockStripeClient.customers.create).toHaveBeenCalledWith({
      email: testCustomer.email,
      name: testCustomer.name,
      metadata: {
        platform: 'case-interview-practice'
      }
    });
  });

  test('should throw error when creating customer with invalid email', async () => {
    const invalidEmail = 'invalid-email';
    mockStripeClient.customers.create.mockRejectedValueOnce(new Error('Invalid email'));

    await expect(createCustomer(invalidEmail, testCustomer.name))
      .rejects
      .toThrow('Failed to create customer');
  });

  test('should handle Stripe API errors during customer creation', async () => {
    mockStripeClient.customers.create.mockRejectedValueOnce(new Error('Stripe API Error'));

    await expect(createCustomer(testCustomer.email, testCustomer.name))
      .rejects
      .toThrow('Failed to create customer');
  });
});

describe('Subscription Management', () => {
  // Requirement: Subscription System - Subscription lifecycle operations
  const testSubscription: Partial<Stripe.Subscription> = {
    id: 'sub_test',
    customer: 'cus_test',
    status: 'active',
    items: {
      data: [{
        price: {
          id: 'price_test'
        }
      }]
    }
  };

  const testPaymentMethod: Partial<Stripe.PaymentMethod> = {
    id: 'pm_test',
    type: 'card'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create subscription with valid payment method', async () => {
    mockStripeClient.paymentMethods.attach.mockResolvedValueOnce(testPaymentMethod as Stripe.PaymentMethod);
    mockStripeClient.customers.update.mockResolvedValueOnce({ id: 'cus_test' } as Stripe.Customer);
    mockStripeClient.subscriptions.create.mockResolvedValueOnce(testSubscription as Stripe.Subscription);

    const subscription = await createSubscription(
      'cus_test',
      'price_test',
      testPaymentMethod as Stripe.PaymentMethod
    );

    expect(subscription.id).toBe(testSubscription.id);
    expect(mockStripeClient.paymentMethods.attach).toHaveBeenCalled();
    expect(mockStripeClient.customers.update).toHaveBeenCalled();
    expect(mockStripeClient.subscriptions.create).toHaveBeenCalled();
  });

  test('should update subscription with new plan', async () => {
    mockStripeClient.subscriptions.update.mockResolvedValueOnce(testSubscription as Stripe.Subscription);

    const updatedSubscription = await updateSubscription('sub_test', {
      items: [{ price: 'price_new' }]
    });

    expect(updatedSubscription.id).toBe(testSubscription.id);
    expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(
      'sub_test',
      expect.objectContaining({
        proration_behavior: 'create_prorations'
      })
    );
  });

  test('should cancel subscription immediately when specified', async () => {
    mockStripeClient.subscriptions.update.mockResolvedValueOnce({
      ...testSubscription,
      status: 'canceled'
    } as Stripe.Subscription);

    const canceledSubscription = await cancelSubscription('sub_test', true);

    expect(canceledSubscription.status).toBe('canceled');
    expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(
      'sub_test',
      expect.objectContaining({
        cancel_at_period_end: false,
        status: 'canceled'
      })
    );
  });

  test('should schedule subscription cancellation at period end', async () => {
    mockStripeClient.subscriptions.update.mockResolvedValueOnce({
      ...testSubscription,
      cancel_at_period_end: true
    } as Stripe.Subscription);

    const subscription = await cancelSubscription('sub_test', false);

    expect(subscription.cancel_at_period_end).toBe(true);
    expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(
      'sub_test',
      expect.objectContaining({
        cancel_at_period_end: true
      })
    );
  });
});

describe('Webhook Processing', () => {
  // Requirement: Payment Processing - Webhook handling and validation
  const testWebhookSecret = 'whsec_test';
  const testSignature = 'test_signature';
  const testTimestamp = Math.floor(Date.now() / 1000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate webhook signature successfully', async () => {
    const payload = Buffer.from(JSON.stringify({ type: 'test.event' }));
    mockStripeClient.webhooks.constructEvent.mockReturnValueOnce({
      type: 'test.event',
      data: { object: {} }
    } as Stripe.Event);

    const isValid = await validateWebhookSignature(payload, testSignature);

    expect(isValid).toBe(true);
    expect(mockStripeClient.webhooks.constructEvent).toHaveBeenCalledWith(
      payload,
      testSignature,
      stripeConfig.webhookSecret
    );
  });

  test('should handle subscription.created webhook event', async () => {
    const subscriptionEvent = {
      type: WEBHOOK_EVENTS.SUBSCRIPTION_CREATED,
      data: {
        object: testSubscription
      }
    };
    const payload = Buffer.from(JSON.stringify(subscriptionEvent));
    
    mockStripeClient.webhooks.constructEvent.mockReturnValueOnce(subscriptionEvent as Stripe.Event);

    const result = await handleWebhook(payload, testSignature);

    expect(result.type).toBe(WEBHOOK_EVENTS.SUBSCRIPTION_CREATED);
    expect(result.data).toEqual(testSubscription);
  });

  test('should handle payment_intent.succeeded webhook event', async () => {
    const paymentEvent = {
      type: WEBHOOK_EVENTS.PAYMENT_SUCCEEDED,
      data: {
        object: {
          id: 'in_test',
          payment_intent: 'pi_test',
          status: 'paid'
        }
      }
    };
    const payload = Buffer.from(JSON.stringify(paymentEvent));
    
    mockStripeClient.webhooks.constructEvent.mockReturnValueOnce(paymentEvent as Stripe.Event);

    const result = await handleWebhook(payload, testSignature);

    expect(result.type).toBe(WEBHOOK_EVENTS.PAYMENT_SUCCEEDED);
    expect(result.data.status).toBe('paid');
  });

  test('should reject invalid webhook signatures', async () => {
    const payload = Buffer.from(JSON.stringify({ type: 'test.event' }));
    mockStripeClient.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('Invalid signature');
    });

    const isValid = await validateWebhookSignature(payload, 'invalid_signature');

    expect(isValid).toBe(false);
  });
});

describe('Payment Intent Creation', () => {
  // Requirement: Payment Processing - Payment intent creation and handling
  const testPaymentIntent: Partial<Stripe.PaymentIntent> = {
    id: 'pi_test',
    client_secret: 'pi_test_secret',
    status: 'requires_payment_method',
    amount: 2000,
    currency: 'usd'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create payment intent with valid parameters', async () => {
    mockStripeClient.paymentIntents.create.mockResolvedValueOnce(
      testPaymentIntent as Stripe.PaymentIntent
    );

    const paymentIntent = await createPaymentIntent('cus_test', 2000);

    expect(paymentIntent.id).toBe(testPaymentIntent.id);
    expect(paymentIntent.amount).toBe(testPaymentIntent.amount);
    expect(mockStripeClient.paymentIntents.create).toHaveBeenCalledWith({
      amount: 2000,
      currency: 'usd',
      customer: 'cus_test',
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        platform: 'case-interview-practice'
      }
    });
  });

  test('should handle errors during payment intent creation', async () => {
    mockStripeClient.paymentIntents.create.mockRejectedValueOnce(
      new Error('Failed to create payment intent')
    );

    await expect(createPaymentIntent('cus_test', 2000))
      .rejects
      .toThrow('Failed to create payment intent');
  });
});