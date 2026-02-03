import { Request, Response } from 'express';
import { constructWebhookEvent } from '../services/stripe';
import * as db from '../db';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature) {
    console.error('[Stripe Webhook] Missing signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event;
  try {
    event = constructWebhookEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Stripe Webhook] Test event detected, returning verification response');
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
        const tier = session.metadata?.tier as 'starter' | 'pro' | 'business';

        if (!userId || !tier) {
          console.error('[Stripe Webhook] Missing userId or tier in metadata');
          break;
        }

        console.log(`[Stripe Webhook] Payment completed for user ${userId}, tier ${tier}`);

        // This is handled in the frontend after redirect, but we can also process here
        // for redundancy and to handle edge cases
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        console.log(`[Stripe Webhook] Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        console.error(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
        break;
      }

      case 'customer.created': {
        const customer = event.data.object as any;
        console.log(`[Stripe Webhook] Customer created: ${customer.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
