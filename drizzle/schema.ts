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
 * Relations for foreign keys
 */
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  aiInstances: many(aiInstances),
  billingRecords: many(billingRecords),
}));

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