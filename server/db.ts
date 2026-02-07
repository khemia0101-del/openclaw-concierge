import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  User,
  users,
  subscriptions,
  InsertSubscription,
  aiInstances,
  InsertAIInstance,
  billingRecords,
  InsertBillingRecord,
  leads,
  InsertLead,
  referrals,
  affiliates,
  commissions,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: Partial<InsertUser> & { openId: string }): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: Record<string, unknown> = {
      openId: user.openId,
      email: user.email || `${user.openId}@temp.openclaw.local`,
    };
    const updateSet: Record<string, unknown> = {};

    if (user.name !== undefined) {
      values.name = user.name ?? null;
      updateSet.name = user.name ?? null;
    }
    if (user.passwordHash !== undefined) {
      values.passwordHash = user.passwordHash ?? null;
      updateSet.passwordHash = user.passwordHash ?? null;
    }
    if (user.loginMethod !== undefined) {
      values.loginMethod = user.loginMethod ?? null;
      updateSet.loginMethod = user.loginMethod ?? null;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    } else {
      values.lastSignedIn = new Date();
      updateSet.lastSignedIn = new Date();
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    } else {
      values.role = 'user';
      updateSet.role = 'user';
    }

    await db.insert(users).values(values as InsertUser).onDuplicateKeyUpdate({
      set: updateSet as any,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Subscription queries
export async function createSubscription(data: Partial<InsertSubscription> & { userId: number; tier: 'starter' | 'pro' | 'business' }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(subscriptions).values(data as any);
  return result;
}

export async function createSubscriptionRaw(data: {
  userId: number;
  tier: 'starter' | 'pro' | 'business';
  status: 'active' | 'paused' | 'cancelled' | 'pending';
  setupFeePaid: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  monthlyPrice: string;
  startDate: Date;
  renewalDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.execute(drizzleSql`
    INSERT INTO subscriptions (
      userId, tier, status, setupFeePaid, 
      stripeCustomerId, stripeSubscriptionId, monthlyPrice, 
      startDate, renewalDate
    ) VALUES (
      ${data.userId}, 
      ${data.tier}, 
      ${data.status}, 
      ${data.setupFeePaid ? 1 : 0},
      ${data.stripeCustomerId},
      ${data.stripeSubscriptionId},
      ${data.monthlyPrice},
      ${data.startDate},
      ${data.renewalDate}
    )
  `);
  
  return result;
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscription(id: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(subscriptions).set(data as any).where(eq(subscriptions.id, id));
}

// AI Instance queries
export async function createAIInstance(data: Partial<InsertAIInstance> & { userId: number; subscriptionId: number }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(aiInstances).values(data as any);
  return result;
}

export async function getAIInstanceByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(aiInstances).where(eq(aiInstances.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAIInstance(id: number, data: Partial<InsertAIInstance>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(aiInstances).set(data as any).where(eq(aiInstances.id, id));
}

// Billing queries
export async function createBillingRecord(data: Partial<InsertBillingRecord> & { userId: number; type: 'setup_fee' | 'monthly_subscription' | 'usage_credit' | 'refund'; amount: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(billingRecords).values(data as any);
  return result;
}

export async function getBillingRecordsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(billingRecords).where(eq(billingRecords.userId, userId));
  return result;
}

// Lead capture queries
export async function captureLead(data: Partial<InsertLead> & { email: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  try {
    // Use onDuplicateKeyUpdate to prevent errors on duplicate emails
    await db.insert(leads).values(data as any).onDuplicateKeyUpdate({
      set: {
        selectedTier: data.selectedTier,
        status: data.status || 'lead',
        updatedAt: new Date(),
      } as any,
    });
  } catch (error) {
    console.error('[Database] Failed to capture lead:', error);
    // Don't throw - we don't want lead capture to block the user flow
  }
}

export async function getLeadByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(leads).where(eq(leads.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLeadStatus(email: string, status: 'lead' | 'checkout_started' | 'paid' | 'abandoned', stripeSessionId?: string, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updateData: any = { status, updatedAt: new Date() };
  if (stripeSessionId) updateData.stripeSessionId = stripeSessionId;
  if (userId != null) updateData.userId = userId;
  
  await db.update(leads).set(updateData).where(eq(leads.email, email));
}

/**
 * Create affiliate commission records when a referred user subscribes.
 * Finds the referral for the user, updates its status, and creates commission entries
 * for both the setup fee and first monthly payment.
 */
export async function createAffiliateCommission(
  userId: number,
  subscriptionId: number,
  setupBillingResult: any,
  monthlyBillingResult: any,
) {
  const db = await getDb();
  if (!db) return;

  try {
    // Find a referral linked to this user (status = signed_up means they signed up but haven't subscribed yet)
    const [referral] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referredUserId, userId),
          eq(referrals.status, "signed_up"),
        ),
      )
      .orderBy(desc(referrals.createdAt))
      .limit(1);

    if (!referral) return;

    // Get the affiliate's commission rate
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, referral.affiliateId))
      .limit(1);

    if (!affiliate || affiliate.status !== "active") return;

    const rate = parseFloat(affiliate.commissionRate) / 100; // e.g. 30.00 → 0.30

    // Get billing records to calculate commission amounts
    const allBilling = await getBillingRecordsByUserId(userId);
    const setupRecord = allBilling.find(r => r.type === "setup_fee");
    const monthlyRecord = allBilling.find(r => r.type === "monthly_subscription");

    // Create commission for setup fee
    if (setupRecord) {
      const setupCommission = (parseFloat(setupRecord.amount) * rate).toFixed(2);
      await db.insert(commissions).values({
        affiliateId: affiliate.id,
        referralId: referral.id,
        subscriptionId,
        billingRecordId: setupRecord.id,
        amount: setupCommission,
        commissionRate: affiliate.commissionRate,
        status: "pending",
        type: "setup_fee",
      } as any);
    }

    // Create commission for first monthly payment
    if (monthlyRecord) {
      const monthlyCommission = (parseFloat(monthlyRecord.amount) * rate).toFixed(2);
      await db.insert(commissions).values({
        affiliateId: affiliate.id,
        referralId: referral.id,
        subscriptionId,
        billingRecordId: monthlyRecord.id,
        amount: monthlyCommission,
        commissionRate: affiliate.commissionRate,
        status: "pending",
        type: "monthly_recurring",
      } as any);
    }

    // Update referral status to subscribed
    await db
      .update(referrals)
      .set({
        status: "subscribed",
        subscriptionId,
        subscribedAt: new Date(),
      } as any)
      .where(eq(referrals.id, referral.id));

    // Update affiliate earnings
    const totalNewCommission = [setupRecord, monthlyRecord]
      .filter(Boolean)
      .reduce((sum, r) => sum + parseFloat(r!.amount) * rate, 0);

    await db.execute(drizzleSql`
      UPDATE affiliates
      SET totalEarnings = totalEarnings + ${totalNewCommission.toFixed(2)},
          pendingEarnings = pendingEarnings + ${totalNewCommission.toFixed(2)}
      WHERE id = ${affiliate.id}
    `);
  } catch (error) {
    console.error("[Database] Failed to create affiliate commission:", error);
    // Non-fatal: don't block subscription creation
  }
}

/**
 * After OAuth login, migrate any subscriptions/instances/billing created under a
 * temporary userId (from onboarding) to the real authenticated user.
 * Links via the leads table: lead.email matches the user's email,
 * and lead.userId holds the temp userId used during onboarding.
 */
export async function migrateOrphanedRecords(userEmail: string, realUserId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const lead = await getLeadByEmail(userEmail);
    if (!lead || !lead.userId || lead.userId === realUserId) return;

    const tempUserId = lead.userId;

    // Migrate subscriptions, billing records, and AI instances from temp → real userId
    await db.update(subscriptions).set({ userId: realUserId } as any).where(eq(subscriptions.userId, tempUserId));
    await db.update(billingRecords).set({ userId: realUserId } as any).where(eq(billingRecords.userId, tempUserId));
    await db.update(aiInstances).set({ userId: realUserId } as any).where(eq(aiInstances.userId, tempUserId));

    // Update the lead record to point at the real userId
    await db.update(leads).set({ userId: realUserId, status: 'paid' } as any).where(eq(leads.email, userEmail));
  } catch (error) {
    console.error('[Database] Failed to migrate orphaned records:', error);
    // Non-fatal: don't block login
  }
}
