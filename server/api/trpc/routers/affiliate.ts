import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../../../_core/trpc";
import { getDb } from "../../../db";
import { affiliates, referrals, commissions, users, subscriptions } from "../../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Generate a unique affiliate code
function generateAffiliateCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${randomSuffix}`;
}

export const affiliateRouter = router({
  /**
   * Get current user's affiliate account
   */
  getMyAffiliate: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, ctx.user.id))
      .limit(1);
    
    return affiliate || null;
  }),
  
  /**
   * Create affiliate account for current user
   */
  createAffiliate: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    // Check if user already has an affiliate account
    const [existing] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, ctx.user.id))
      .limit(1);
    
    if (existing) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You already have an affiliate account",
      });
    }
    
    // Generate unique affiliate code
    let affiliateCode = generateAffiliateCode(ctx.user.name || ctx.user.email);
    let attempts = 0;
    
    while (attempts < 10) {
      const [existingCode] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.affiliateCode, affiliateCode))
        .limit(1);
      
      if (!existingCode) break;
      
      affiliateCode = generateAffiliateCode(ctx.user.name || ctx.user.email);
      attempts++;
    }
    
    // Create affiliate account
    const [newAffiliate] = await db.insert(affiliates).values({
      userId: ctx.user.id,
      affiliateCode,
      status: "active",
      commissionRate: "30.00",
    });
    
    return { success: true, affiliateCode };
  }),
  
  /**
   * Update payment information
   */
  updatePaymentInfo: protectedProcedure
    .input(z.object({
      paypalEmail: z.string().email().optional(),
      bankDetails: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [affiliate] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.userId, ctx.user.id))
        .limit(1);
      
      if (!affiliate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Affiliate account not found",
        });
      }
      
      await db
        .update(affiliates)
        .set({
          paypalEmail: input.paypalEmail,
          bankDetails: input.bankDetails,
        })
        .where(eq(affiliates.id, affiliate.id));
      
      return { success: true };
    }),
  
  /**
   * Get affiliate stats
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, ctx.user.id))
      .limit(1);
    
    if (!affiliate) {
      return null;
    }
    
    const allReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.affiliateId, affiliate.id));
    
    const totalReferrals = allReferrals.length;
    const signedUpReferrals = allReferrals.filter((r: any) => r.status === "signed_up" || r.status === "subscribed").length;
    const subscribedReferrals = allReferrals.filter((r: any) => r.status === "subscribed").length;
    
    return {
      totalReferrals,
      signedUpReferrals,
      subscribedReferrals,
      conversionRate: totalReferrals > 0 ? (subscribedReferrals / totalReferrals * 100).toFixed(1) : "0",
    };
  }),
  
  /**
   * Get referrals list
   */
  getReferrals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, ctx.user.id))
      .limit(1);
    
    if (!affiliate) {
      return [];
    }
    
    const referralsList = await db
      .select()
      .from(referrals)
      .where(eq(referrals.affiliateId, affiliate.id))
      .orderBy(desc(referrals.createdAt))
      .limit(50);
    
    return referralsList;
  }),
  
  /**
   * Get commissions list
   */
  getCommissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, ctx.user.id))
      .limit(1);
    
    if (!affiliate) {
      return [];
    }
    
    const commissionsList = await db
      .select()
      .from(commissions)
      .where(eq(commissions.affiliateId, affiliate.id))
      .orderBy(desc(commissions.createdAt))
      .limit(50);
    
    return commissionsList;
  }),
  
  /**
   * Track referral click (public endpoint)
   */
  trackClick: publicProcedure
    .input(z.object({
      affiliateCode: z.string(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Find affiliate by code
      const [affiliate] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.affiliateCode, input.affiliateCode))
        .limit(1);
      
      if (!affiliate || affiliate.status !== "active") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid affiliate code",
        });
      }
      
      // Create referral record
      await db.insert(referrals).values({
        affiliateId: affiliate.id,
        status: "pending",
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      
      return { success: true };
    }),
  
  /**
   * Link referral to user after signup (internal use)
   */
  linkReferralToUser: protectedProcedure
    .input(z.object({
      affiliateCode: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Find affiliate
      const [affiliate] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.affiliateCode, input.affiliateCode))
        .limit(1);
      
      if (!affiliate) {
        return { success: false };
      }
      
      // Find most recent pending referral for this affiliate
      const [referral] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.affiliateId, affiliate.id),
            eq(referrals.status, "pending")
          )
        )
        .orderBy(desc(referrals.createdAt))
        .limit(1);
      
      if (referral) {
        await db
          .update(referrals)
          .set({
            referredUserId: ctx.user.id,
            referredEmail: ctx.user.email,
            status: "signed_up",
            signedUpAt: new Date(),
          })
          .where(eq(referrals.id, referral.id));
      }
      
      return { success: true };
    }),
});
