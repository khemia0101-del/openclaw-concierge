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

          const renewalDate = await stripeService.getRenewalDate(stripeSubscriptionId);

          await db.createSubscriptionRaw({
            userId,
            tier,
            status: 'active',
            setupFeePaid: true,
            stripeCustomerId: stripeCustomerId || null,
            stripeSubscriptionId: stripeSubscriptionId || null,
            monthlyPrice: monthlyPriceValue,
            startDate: new Date(),
            renewalDate,
          });

          const setupFee = stripeService.PRICING[tier].setupFee;
          const monthlyFee = stripeService.PRICING[tier].monthlyPrice;
          const setupBillingResult = await db.createBillingRecord({
            userId,
            type: 'setup_fee',
            amount: (setupFee / 100).toFixed(2),
            status: 'completed',
            stripeChargeId: session.payment_intent as string,
          });

          const monthlyBillingResult = await db.createBillingRecord({
            userId,
            type: 'monthly_subscription',
            amount: (monthlyFee / 100).toFixed(2),
            status: 'completed',
          });

          // Create affiliate commission if this user was referred
          const newSub = await db.getSubscriptionByUserId(userId);
          if (newSub) {
            await db.createAffiliateCommission(userId, newSub.id, setupBillingResult, monthlyBillingResult);
          }
        }

        // Get email from session metadata
        const email = session.metadata?.customerEmail || session.customer_email || '';

        return { success: true, email, tier, userId };
      }),
    
    // Check instance deployment status (polled by DeploymentProgress)
    getInstanceStatus: publicProcedure
      .input(z.object({
        userId: z.number().int().max(2147483647),
        sessionId: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const instance = await db.getAIInstanceByUserId(input.userId);
        if (!instance) return null;

        return {
          status: instance.status,
          errorMessage: instance.errorMessage,
          doAppId: instance.doAppId,
        };
      }),

    // Deploy AI instance
    deployInstance: publicProcedure
      .input(z.object({
        sessionId: z.string().min(1),
        userId: z.number().int().max(2147483647),
        userEmail: z.string().email(),
        aiRole: z.string(),
        telegramBotToken: z.string().regex(/^\d+:[A-Za-z0-9_-]{20,}$/, 'Invalid Telegram bot token format. Expected format: 123456789:ABCdefGHI_jklMNO-pqrsTUVwxyz').optional().or(z.literal('')),
        communicationChannels: z.array(z.string()),
        connectedServices: z.array(z.string()),
        customApiKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const userId = input.userId;

        // Step 1: Verify Stripe session
        let session;
        try {
          session = await stripeService.getCheckoutSession(input.sessionId);
        } catch (err: any) {
          console.error('[Deploy] Failed to retrieve Stripe session:', err.message);
          throw new Error('Could not verify payment session. Please try again.');
        }

        const metadataUserId = parseInt(session.metadata?.userId || '0');
        if (metadataUserId !== userId) {
          throw new Error('Session does not match user');
        }

        // Step 2: Get or wait for subscription
        let subscription = await db.getSubscriptionByUserId(userId);
        if (!subscription) {
          // Subscription might not be created yet if verifyPayment was slow.
          // Try creating it here as a fallback.
          console.warn('[Deploy] No subscription found for userId', userId, '— creating from session');
          const tier = session.metadata?.tier as 'starter' | 'pro' | 'business';
          if (tier && session.payment_status === 'paid') {
            const monthlyPriceValue = (stripeService.PRICING[tier].monthlyPrice / 100).toFixed(2);
            try {
              await db.createSubscriptionRaw({
                userId,
                tier,
                status: 'active',
                setupFeePaid: true,
                stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
                stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null,
                monthlyPrice: monthlyPriceValue,
                startDate: new Date(),
                renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });
              subscription = await db.getSubscriptionByUserId(userId);
            } catch (subErr: any) {
              console.error('[Deploy] Failed to create fallback subscription:', subErr.message);
            }
          }
        }

        if (!subscription) {
          throw new Error('No active subscription found. Please contact support.');
        }

        // Step 3: Create AI instance (idempotent — skip if one already exists)
        let instanceId: number;
        const existingInstance = await db.getAIInstanceByUserId(userId);
        if (existingInstance) {
          instanceId = existingInstance.id;
          // Reset instance for retry if it was stuck or errored
          if (existingInstance.status === 'error' || existingInstance.status === 'provisioning') {
            await db.updateAIInstance(instanceId, {
              status: 'provisioning',
              errorMessage: null,
              aiRole: input.aiRole,
              telegramBotToken: input.telegramBotToken,
              config: {
                communicationChannels: input.communicationChannels,
                connectedServices: input.connectedServices,
              },
            } as any);
          }
        } else {
          try {
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
            instanceId = instanceResult[0].insertId;
          } catch (instErr: any) {
            console.error('[Deploy] Failed to create AI instance record:', instErr.message);
            throw new Error('Failed to create deployment record. Please try again.');
          }
        }

        // Step 4: Provision on DigitalOcean in the background (fire-and-forget).
        // The client polls getInstanceStatus to track progress.
        // If DO provisioning fails or is unavailable, the instance record still
        // exists so the user can reach their dashboard.
        if (process.env.DO_API_TOKEN) {
          digitaloceanService.createOpenClawApp({
            userId,
            userEmail: input.userEmail,
            aiRole: input.aiRole,
            tier: subscription.tier,
            telegramBotToken: input.telegramBotToken,
            customApiKey: input.customApiKey,
            config: {
              communicationChannels: input.communicationChannels,
              connectedServices: input.connectedServices,
            },
          }).then(async (app) => {
            // Store the app ID, gateway token, and live URL so customer can access their instance
            const instanceUrl = app.live_url || (app.default_ingress ? `https://${app.default_ingress}` : null);
            await db.updateAIInstance(instanceId, {
              doAppId: app.id,
              status: 'running',
              config: {
                communicationChannels: input.communicationChannels,
                connectedServices: input.connectedServices,
                gatewayToken: app.gatewayToken,
                instanceUrl,
              },
            } as any);
            console.log('[Deploy] DO app created:', app.id, 'URL:', instanceUrl);
          }).catch(async (error: any) => {
            console.error('[Deploy] DO provisioning failed:', error.message);
            await db.updateAIInstance(instanceId, {
              status: 'error',
              errorMessage: `Deployment failed: ${error.message}. Please contact support.`,
            });
          });
        } else {
          console.error('[Deploy] DO_API_TOKEN not set — cannot provision');
          await db.updateAIInstance(instanceId, {
            status: 'error',
            errorMessage: 'Cloud hosting is not configured. Please contact support.',
          });
        }

        return { success: true };
      }),
  }),
  
  affiliate: affiliateRouter,
  
  dashboard: router({
    // Diagnostic: test DO API connectivity (temporary - remove after debugging)
    testDOConnection: publicProcedure.query(async () => {
      const token = process.env.DO_API_TOKEN;
      if (!token) {
        return { ok: false, error: 'DO_API_TOKEN is not set in environment' };
      }
      try {
        const resp = await fetch('https://api.digitalocean.com/v2/account', {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        });
        const data = await resp.json();
        if (!resp.ok) {
          return { ok: false, status: resp.status, error: data };
        }
        return {
          ok: true,
          email: data.account.email,
          status: data.account.status,
          dropletLimit: data.account.droplet_limit,
        };
      } catch (e: any) {
        return { ok: false, error: e.message };
      }
    }),

    // Get user's subscription and instance details
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      let instance = await db.getAIInstanceByUserId(ctx.user.id);
      const billingRecords = await db.getBillingRecordsByUserId(ctx.user.id);

      // Detect stuck provisioning: if instance has been "provisioning" for > 10 minutes, mark as error
      if (instance && instance.status === 'provisioning') {
        const PROVISIONING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
        const createdAt = new Date(instance.createdAt).getTime();
        if (Date.now() - createdAt > PROVISIONING_TIMEOUT_MS) {
          await db.updateAIInstance(instance.id, {
            status: 'error',
            errorMessage: 'Provisioning timed out. Please contact support or try restarting.',
          });
          instance = { ...instance, status: 'error', errorMessage: 'Provisioning timed out. Please contact support or try restarting.' };
        }
      }

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
    
    // Retry deployment for failed/errored instances
    retryDeploy: protectedProcedure.mutation(async ({ ctx }) => {
      const instance = await db.getAIInstanceByUserId(ctx.user.id);
      if (!instance) {
        throw new Error('No instance found');
      }
      if (instance.status !== 'error') {
        throw new Error('Instance is not in an error state');
      }

      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      if (!process.env.DO_API_TOKEN) {
        throw new Error('Cloud hosting is not configured. Please contact support.');
      }

      // Reset to provisioning
      await db.updateAIInstance(instance.id, {
        status: 'provisioning',
        errorMessage: null,
        createdAt: new Date(), // Reset timer
      } as any);

      // Fire off DO provisioning
      digitaloceanService.createOpenClawApp({
        userId: ctx.user.id,
        userEmail: ctx.user.email || '',
        aiRole: instance.aiRole || '',
        tier: subscription.tier,
        telegramBotToken: instance.telegramBotToken || undefined,
        config: (instance.config as Record<string, any>) || {},
      }).then(async (app) => {
        const instanceUrl = app.live_url || (app.default_ingress ? `https://${app.default_ingress}` : null);
        await db.updateAIInstance(instance.id, {
          doAppId: app.id,
          status: 'running',
          errorMessage: null,
          config: {
            ...((instance.config as Record<string, any>) || {}),
            gatewayToken: app.gatewayToken,
            instanceUrl,
          },
        } as any);
        console.log('[RetryDeploy] DO app created:', app.id, 'URL:', instanceUrl);
      }).catch(async (error: any) => {
        console.error('[RetryDeploy] DO provisioning failed:', error.message);
        await db.updateAIInstance(instance.id, {
          status: 'error',
          errorMessage: `Deployment failed: ${error.message}`,
        });
      });

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
