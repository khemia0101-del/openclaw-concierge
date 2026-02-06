import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as stripeService from "./services/stripe";
import * as digitaloceanService from "./services/digitalocean";
import { affiliateRouter } from "./api/trpc/routers/affiliate";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  onboarding: router({
    // Create checkout session for payment
    createCheckout: publicProcedure
      .input(z.object({
        email: z.string().email(),
        tier: z.enum(['starter', 'pro', 'business']),
        userId: z.number().int().max(2147483647),
        origin: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        // Capture lead for marketing follow-up
        await db.captureLead({
          email: input.email,
          selectedTier: input.tier,
          status: 'checkout_started',
          source: 'onboarding',
        });
        
        const session = await stripeService.createCheckoutSession({
          customerEmail: input.email,
          tier: input.tier,
          userId: input.userId,
          successUrl: `${input.origin}/onboarding/configure?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${input.origin}/onboarding/payment`,
        });
        
        // Update lead with Stripe session ID
        await db.updateLeadStatus(input.email, 'checkout_started', session.id);
        
        return { sessionUrl: session.url || '', sessionId: session.id };
      }),
    
    // Verify payment and create subscription
    verifyPayment: publicProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const session = await stripeService.getCheckoutSession(input.sessionId);

        if (session.payment_status !== 'paid') {
          throw new Error('Payment not completed');
        }

        // Get tier from session metadata
        const tier = session.metadata?.tier as 'starter' | 'pro' | 'business';
        if (!tier) {
          throw new Error('Tier information missing from payment session');
        }

        // Use the canonical userId from the Stripe session metadata (set during checkout creation)
        const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
        if (!userId || userId > 2147483647) {
          throw new Error('User ID missing or invalid in payment session');
        }

        // Idempotent: skip if subscription already created (e.g. by webhook)
        const existing = await db.getSubscriptionByUserId(userId);
        if (!existing) {
          const monthlyPriceValue = (stripeService.PRICING[tier].monthlyPrice / 100).toFixed(2);

          let stripeCustomerId: string | undefined = undefined;
          if (typeof session.customer === 'string' && session.customer) {
            stripeCustomerId = session.customer;
          } else if (typeof session.customer === 'object' && session.customer?.id) {
            stripeCustomerId = session.customer.id;
          }

          let stripeSubscriptionId: string | undefined = undefined;
          if (session.subscription) {
            if (typeof session.subscription === 'string' && session.subscription) {
              stripeSubscriptionId = session.subscription;
            } else if (typeof session.subscription === 'object' && session.subscription.id) {
              stripeSubscriptionId = session.subscription.id;
            }
          }

          await db.createSubscriptionRaw({
            userId,
            tier,
            status: 'active',
            setupFeePaid: true,
            stripeCustomerId: stripeCustomerId || null,
            stripeSubscriptionId: stripeSubscriptionId || null,
            monthlyPrice: monthlyPriceValue,
            startDate: new Date(),
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });

          const setupFee = stripeService.PRICING[tier].setupFee;
          const monthlyFee = stripeService.PRICING[tier].monthlyPrice;
          await db.createBillingRecord({
            userId,
            type: 'setup_fee',
            amount: (setupFee / 100).toFixed(2),
            status: 'completed',
            stripeChargeId: session.payment_intent as string,
          });

          await db.createBillingRecord({
            userId,
            type: 'monthly_subscription',
            amount: (monthlyFee / 100).toFixed(2),
            status: 'completed',
          });
        }

        // Get email from session metadata
        const email = session.metadata?.customerEmail || session.customer_email || '';

        return { success: true, email, tier, userId };
      }),
    
    // Deploy AI instance
    deployInstance: publicProcedure
      .input(z.object({
        sessionId: z.string().min(1),
        userId: z.number().int().max(2147483647),
        userEmail: z.string().email(),
        aiRole: z.string(),
        telegramBotToken: z.string().optional(),
        communicationChannels: z.array(z.string()),
        connectedServices: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        // Verify the Stripe session belongs to this user (proof-of-purchase)
        const session = await stripeService.getCheckoutSession(input.sessionId);
        const metadataUserId = parseInt(session.metadata?.userId || '0');
        if (metadataUserId !== input.userId) {
          throw new Error('Session does not match user');
        }

        const userId = input.userId;
        const subscription = await db.getSubscriptionByUserId(userId);
        
        if (!subscription) {
          throw new Error('No active subscription found');
        }
        
        // Create AI instance record
        const instanceResult = await db.createAIInstance({
          userId,
          subscriptionId: subscription.id,
          status: 'provisioning',
          aiRole: input.aiRole,
          telegramBotToken: input.telegramBotToken,
          config: {
            communicationChannels: input.communicationChannels,
            connectedServices: input.connectedServices,
          },
        });
        
        // Provision on DigitalOcean (async)
        try {
          const app = await digitaloceanService.createOpenClawApp({
            userId,
            userEmail: input.userEmail,
            aiRole: input.aiRole,
            tier: subscription.tier,
            telegramBotToken: input.telegramBotToken,
            config: {
              communicationChannels: input.communicationChannels,
              connectedServices: input.connectedServices,
            },
          });
          
          // Update instance with DO app details
          await db.updateAIInstance(instanceResult[0].insertId, {
            doAppId: app.id,
            status: 'running',
          });
          
          return { success: true, appId: app.id };
        } catch (error: any) {
          // Update instance with error
          await db.updateAIInstance(instanceResult[0].insertId, {
            status: 'error',
            errorMessage: error.message,
          });
          
          throw error;
        }
      }),
  }),
  
  affiliate: affiliateRouter,
  
  dashboard: router({
    // Get user's subscription and instance details
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      const instance = await db.getAIInstanceByUserId(ctx.user.id);
      const billingRecords = await db.getBillingRecordsByUserId(ctx.user.id);
      
      return {
        subscription,
        instance,
        billingRecords,
      };
    }),
    
    // Restart AI instance
    restartInstance: protectedProcedure.mutation(async ({ ctx }) => {
      const instance = await db.getAIInstanceByUserId(ctx.user.id);
      
      if (!instance || !instance.doAppId) {
        throw new Error('No instance found');
      }
      
      await digitaloceanService.restartApp(instance.doAppId);
      return { success: true };
    }),
    
    // Get instance logs
    getLogs: protectedProcedure.query(async ({ ctx }) => {
      const instance = await db.getAIInstanceByUserId(ctx.user.id);
      
      if (!instance || !instance.doAppId) {
        return { logs: [] };
      }
      
      const logs = await digitaloceanService.getAppLogs(instance.doAppId);
      return { logs };
    }),
  }),
});

export type AppRouter = typeof appRouter;
