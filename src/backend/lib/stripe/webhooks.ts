// @package stripe ^12.0.0

/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint URL in Stripe dashboard
 * 2. Set up monitoring for webhook failures and payment processing errors
 * 3. Configure proper logging for webhook events
 * 4. Set up alerts for failed payment notifications
 * 5. Ensure proper error tracking for webhook processing failures
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { SubscriptionService } from '../../services/SubscriptionService';
import { APIError } from '../errors/APIError';
import { Subscription } from '../../types/subscription';
import { stripeClient, stripeConfig } from '../../config/stripe';
import { APIErrorCode } from '../../types/api';

// Initialize subscription service
const subscriptionService = new SubscriptionService();

/**
 * Validates the Stripe webhook signature to ensure request authenticity
 * Requirement: Payment Processing - Secure webhook signature validation
 */
export const validateWebhookSignature = async (
  payload: string,
  signature: string
): Promise<boolean> => {
  try {
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret
    );
    return true;
  } catch (err) {
    console.error('Webhook signature validation failed:', err);
    throw new APIError(
      APIErrorCode.VALIDATION_ERROR,
      'Invalid webhook signature',
      { error: err instanceof Error ? err.message : String(err) }
    );
  }
};

/**
 * Handles subscription.created webhook event
 * Requirement: Subscription System - Payment processing integration
 */
const handleSubscriptionCreated = async (event: Stripe.Event): Promise<void> => {
  const subscription = event.data.object as Stripe.Subscription;
  try {
    await subscriptionService.handleWebhook(event);
    console.log(`Subscription created successfully: ${subscription.id}`);
  } catch (err) {
    console.error('Failed to handle subscription creation:', err);
    throw new APIError(
      APIErrorCode.INTERNAL_ERROR,
      'Failed to process subscription creation',
      { subscriptionId: subscription.id, error: err instanceof Error ? err.message : String(err) }
    );
  }
};

/**
 * Handles subscription.updated webhook event
 * Requirement: Subscription System - Account management
 */
const handleSubscriptionUpdated = async (event: Stripe.Event): Promise<void> => {
  const subscription = event.data.object as Stripe.Subscription;
  try {
    await subscriptionService.handleWebhook(event);
    console.log(`Subscription updated successfully: ${subscription.id}`);
  } catch (err) {
    console.error('Failed to handle subscription update:', err);
    throw new APIError(
      APIErrorCode.INTERNAL_ERROR,
      'Failed to process subscription update',
      { subscriptionId: subscription.id, error: err instanceof Error ? err.message : String(err) }
    );
  }
};

/**
 * Handles subscription.deleted webhook event
 * Requirement: Subscription System - Account management
 */
const handleSubscriptionDeleted = async (event: Stripe.Event): Promise<void> => {
  const subscription = event.data.object as Stripe.Subscription;
  try {
    await subscriptionService.handleWebhook(event);
    console.log(`Subscription deleted successfully: ${subscription.id}`);
  } catch (err) {
    console.error('Failed to handle subscription deletion:', err);
    throw new APIError(
      APIErrorCode.INTERNAL_ERROR,
      'Failed to process subscription deletion',
      { subscriptionId: subscription.id, error: err instanceof Error ? err.message : String(err) }
    );
  }
};

/**
 * Handles payment_intent.payment_failed webhook event
 * Requirement: Payment Processing - Payment failure handling
 */
const handlePaymentFailed = async (event: Stripe.Event): Promise<void> => {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  try {
    await subscriptionService.handleWebhook(event);
    console.log(`Payment failed for intent: ${paymentIntent.id}`);
  } catch (err) {
    console.error('Failed to handle payment failure:', err);
    throw new APIError(
      APIErrorCode.INTERNAL_ERROR,
      'Failed to process payment failure',
      { paymentIntentId: paymentIntent.id, error: err instanceof Error ? err.message : String(err) }
    );
  }
};

/**
 * Main webhook handler that processes all incoming Stripe webhook events
 * Requirement: Payment Processing - Webhook event handling
 */
export const handleWebhook = async (
  req: Request & { body: string },
  res: Response
): Promise<Response> => {
  const signature = req.headers['stripe-signature'] as string;
  const payload = req.body;

  try {
    // Validate webhook signature
    if (!signature) {
      throw new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Missing Stripe signature header'
      );
    }

    const isValid = await validateWebhookSignature(payload, signature);
    if (!isValid) {
      throw new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Invalid webhook signature'
      );
    }

    // Parse and handle the event
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret
    );

    // Route to appropriate handler based on event type
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing failed:', err);
    if (err instanceof APIError) {
      return res.status(400).json(err.toJSON());
    }
    return res.status(500).json(
      new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Failed to process webhook',
        { error: err instanceof Error ? err.message : String(err) }
      ).toJSON()
    );
  }
};