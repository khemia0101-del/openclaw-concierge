import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as stripeService from "./services/stripe";
import * as digitaloceanService from "./services/digitalocean";

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
        userId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const session = await stripeService.createCheckoutSession({
          customerEmail: input.email,
          tier: input.tier,
          userId: input.userId,
          successUrl: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/onboarding/configure?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/onboarding/payment`,
        });
        
        return { sessionUrl: session.url || '', sessionId: session.id };
      }),
    
    // Verify payment and create subscription
    verifyPayment: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        userId: z.number(),
        tier: z.enum(['starter', 'pro', 'business']),
      }))
      .mutation(async ({ input }) => {
        const session = await stripeService.getCheckoutSession(input.sessionId);
        
        if (session.payment_status !== 'paid') {
          throw new Error('Payment not completed');
        }
        
        // Create subscription record
        await db.createSubscription({
          userId: input.userId,
          tier: input.tier,
          status: 'active',
          setupFeePaid: true,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
          monthlyPrice: stripeService.PRICING[input.tier].monthlyPrice.toString(),
          startDate: new Date(),
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        
        // Create billing record
        const setupFee = stripeService.PRICING[input.tier].setupFee;
        const monthlyFee = stripeService.PRICING[input.tier].monthlyPrice;
        await db.createBillingRecord({
          userId: input.userId,
          type: 'setup_fee',
          amount: (setupFee / 100).toFixed(2),
          status: 'completed',
          stripeChargeId: session.payment_intent as string,
        });
        
        await db.createBillingRecord({
          userId: input.userId,
          type: 'monthly_subscription',
          amount: (monthlyFee / 100).toFixed(2),
          status: 'completed',
        });
        
        return { success: true };
      }),
    
    // Deploy AI instance
    deployInstance: protectedProcedure
      .input(z.object({
        aiRole: z.string(),
        telegramBotToken: z.string().optional(),
        communicationChannels: z.array(z.string()),
        connectedServices: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
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
            userEmail: ctx.user.email || '',
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
