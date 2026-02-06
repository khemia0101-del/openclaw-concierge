import { eq, sql as drizzleSql } from "drizzle-orm";
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
  InsertLead
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
