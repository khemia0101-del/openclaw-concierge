import express from 'express';
import { handleStripeWebhook } from '../webhooks/stripe';

export function registerWebhookRoutes(app: express.Application) {
  // Stripe webhook - MUST use raw body parser
  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );
}
