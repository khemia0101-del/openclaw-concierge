import { describe, it, expect, beforeAll } from "vitest";
import { affiliateRouter } from "./api/trpc/routers/affiliate";
import { getDb } from "./db";
import { affiliates, referrals, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Affiliate Program", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testUserId: number;
  let testAffiliateId: number;
  let testAffiliateCode: string;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Create a test user
    const [userResult] = await db.insert(users).values({
      openId: `test-affiliate-${Date.now()}`,
      email: `affiliate-test-${Date.now()}@test.com`,
      name: "Test Affiliate User",
      role: "user",
    });
    
    testUserId = userResult.insertId;
  });

  it("should create an affiliate account", async () => {
    const caller = affiliateRouter.createCaller({
      user: { id: testUserId, email: "test@test.com", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.createAffiliate();
    
    expect(result.success).toBe(true);
    expect(result.affiliateCode).toBeDefined();
    expect(result.affiliateCode).toMatch(/^[A-Z0-9]+$/);
    
    testAffiliateCode = result.affiliateCode;

    // Verify affiliate was created in database
    const [affiliate] = await db!
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, testUserId))
      .limit(1);

    expect(affiliate).toBeDefined();
    expect(affiliate.affiliateCode).toBe(testAffiliateCode);
    expect(affiliate.commissionRate).toBe("30.00");
    expect(affiliate.status).toBe("active");
    
    testAffiliateId = affiliate.id;
  });

  it("should retrieve affiliate account", async () => {
    const caller = affiliateRouter.createCaller({
      user: { id: testUserId, email: "test@test.com", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const affiliate = await caller.getMyAffiliate();
    
    expect(affiliate).toBeDefined();
    expect(affiliate?.affiliateCode).toBe(testAffiliateCode);
    expect(affiliate?.userId).toBe(testUserId);
  });

  it("should track referral click", async () => {
    const caller = affiliateRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.trackClick({
      affiliateCode: testAffiliateCode,
      ipAddress: "127.0.0.1",
      userAgent: "Test Browser",
    });
    
    expect(result.success).toBe(true);

    // Verify referral was created
    const referralsList = await db!
      .select()
      .from(referrals)
      .where(eq(referrals.affiliateId, testAffiliateId))
      .limit(1);

    expect(referralsList.length).toBeGreaterThan(0);
    expect(referralsList[0].status).toBe("pending");
    expect(referralsList[0].ipAddress).toBe("127.0.0.1");
  });

  it("should get affiliate stats", async () => {
    const caller = affiliateRouter.createCaller({
      user: { id: testUserId, email: "test@test.com", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const stats = await caller.getStats();
    
    expect(stats).toBeDefined();
    expect(stats?.totalReferrals).toBeGreaterThanOrEqual(1);
    expect(stats?.conversionRate).toBeDefined();
  });

  it("should update payment information", async () => {
    const caller = affiliateRouter.createCaller({
      user: { id: testUserId, email: "test@test.com", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.updatePaymentInfo({
      paypalEmail: "payout@test.com",
    });
    
    expect(result.success).toBe(true);

    // Verify payment info was updated
    const [affiliate] = await db!
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, testAffiliateId))
      .limit(1);

    expect(affiliate.paypalEmail).toBe("payout@test.com");
  });

  it("should prevent duplicate affiliate accounts", async () => {
    const caller = affiliateRouter.createCaller({
      user: { id: testUserId, email: "test@test.com", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    await expect(caller.createAffiliate()).rejects.toThrow("already have an affiliate account");
  });

  it("should reject invalid affiliate code", async () => {
    const caller = affiliateRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.trackClick({
        affiliateCode: "INVALID123",
        ipAddress: "127.0.0.1",
      })
    ).rejects.toThrow("Invalid affiliate code");
  });
});
