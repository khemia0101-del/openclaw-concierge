import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscriptions table - tracks user subscription plans and status
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tier: mysqlEnum("tier", ["starter", "pro", "business"]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "cancelled", "pending"]).default("pending").notNull(),
  setupFeePaid: boolean("setupFeePaid").default(false).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }),
  startDate: timestamp("startDate"),
  renewalDate: timestamp("renewalDate"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * AI Instances table - tracks deployed OpenClaw instances
 */
export const aiInstances = mysqlTable("aiInstances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId").notNull(),
  status: mysqlEnum("status", ["provisioning", "running", "stopped", "error", "deleted"]).default("provisioning").notNull(),
  deploymentId: varchar("deploymentId", { length: 255 }),
  doAppId: varchar("doAppId", { length: 255 }),
  telegramBotToken: text("telegramBotToken"),
  telegramBotUsername: varchar("telegramBotUsername", { length: 255 }),
  aiEmail: varchar("aiEmail", { length: 255 }),
  aiRole: text("aiRole"),
  config: json("config"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIInstance = typeof aiInstances.$inferSelect;
export type InsertAIInstance = typeof aiInstances.$inferInsert;

/**
 * Billing Records table - tracks all charges
 */
export const billingRecords = mysqlTable("billingRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  type: mysqlEnum("type", ["setup_fee", "monthly_subscription", "usage_credit", "refund"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BillingRecord = typeof billingRecords.$inferSelect;
export type InsertBillingRecord = typeof billingRecords.$inferInsert;

/**
 * Usage Metrics table - tracks token consumption and API usage
 */
export const usageMetrics = mysqlTable("usageMetrics", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  tokensConsumed: int("tokensConsumed").default(0).notNull(),
  apiCalls: int("apiCalls").default(0).notNull(),
  costUSD: decimal("costUSD", { precision: 10, scale: 4 }).default("0"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = typeof usageMetrics.$inferInsert;

/**
 * Leads table - captures all email signups for marketing follow-up
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  selectedTier: mysqlEnum("selectedTier", ["starter", "pro", "business"]),
  status: mysqlEnum("status", ["lead", "checkout_started", "paid", "abandoned"]).default("lead").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  userId: int("userId"), // Null until they complete signup
  source: varchar("source", { length: 100 }).default("onboarding").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Relations for foreign keys
 */
// Removed - see usersRelationsUpdated at bottom of file

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  aiInstances: many(aiInstances),
  billingRecords: many(billingRecords),
}));

export const aiInstancesRelations = relations(aiInstances, ({ one, many }) => ({
  user: one(users, {
    fields: [aiInstances.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [aiInstances.subscriptionId],
    references: [subscriptions.id],
  }),
  usageMetrics: many(usageMetrics),
}));

export const billingRecordsRelations = relations(billingRecords, ({ one }) => ({
  user: one(users, {
    fields: [billingRecords.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [billingRecords.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
  instance: one(aiInstances, {
    fields: [usageMetrics.instanceId],
    references: [aiInstances.id],
  }),
}));

/**
 * Affiliates table - tracks affiliate partners and their referral codes
 */
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One affiliate account per user
  affiliateCode: varchar("affiliateCode", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "suspended", "pending"]).default("active").notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("30.00").notNull(), // 30% default
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0").notNull(),
  pendingEarnings: decimal("pendingEarnings", { precision: 10, scale: 2 }).default("0").notNull(),
  paidEarnings: decimal("paidEarnings", { precision: 10, scale: 2 }).default("0").notNull(),
  paypalEmail: varchar("paypalEmail", { length: 320 }),
  bankDetails: json("bankDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

/**
 * Referrals table - tracks referred users and their conversion status
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  referredUserId: int("referredUserId"), // Null until user signs up
  referredEmail: varchar("referredEmail", { length: 320 }),
  status: mysqlEnum("status", ["pending", "signed_up", "subscribed", "cancelled"]).default("pending").notNull(),
  subscriptionId: int("subscriptionId"),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
  signedUpAt: timestamp("signedUpAt"),
  subscribedAt: timestamp("subscribedAt"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Commissions table - tracks commission payments for each subscription
 */
export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  referralId: int("referralId").notNull(),
  subscriptionId: int("subscriptionId").notNull(),
  billingRecordId: int("billingRecordId"), // Link to the payment that generated this commission
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "cancelled"]).default("pending").notNull(),
  type: mysqlEnum("type", ["setup_fee", "monthly_recurring"]).notNull(),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

/**
 * Affiliate Payouts table - tracks batch payments to affiliates
 */
export const affiliatePayouts = mysqlTable("affiliatePayouts", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: mysqlEnum("method", ["paypal", "bank_transfer", "stripe"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  commissionIds: json("commissionIds"), // Array of commission IDs included in this payout
  notes: text("notes"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type InsertAffiliatePayout = typeof affiliatePayouts.$inferInsert;

/**
 * Affiliate Relations
 */
export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id],
  }),
  referrals: many(referrals),
  commissions: many(commissions),
  payouts: many(affiliatePayouts),
}));

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  affiliate: one(affiliates, {
    fields: [referrals.affiliateId],
    references: [affiliates.id],
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [referrals.subscriptionId],
    references: [subscriptions.id],
  }),
  commissions: many(commissions),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [commissions.affiliateId],
    references: [affiliates.id],
  }),
  referral: one(referrals, {
    fields: [commissions.referralId],
    references: [referrals.id],
  }),
  subscription: one(subscriptions, {
    fields: [commissions.subscriptionId],
    references: [subscriptions.id],
  }),
  billingRecord: one(billingRecords, {
    fields: [commissions.billingRecordId],
    references: [billingRecords.id],
  }),
}));

export const affiliatePayoutsRelations = relations(affiliatePayouts, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [affiliatePayouts.affiliateId],
    references: [affiliates.id],
  }),
}));

// Update users relations to include affiliates
export const usersRelationsUpdated = relations(users, ({ one, many }) => ({
  subscriptions: many(subscriptions),
  aiInstances: many(aiInstances),
  billingRecords: many(billingRecords),
  affiliate: one(affiliates),
  referrals: many(referrals),
}));