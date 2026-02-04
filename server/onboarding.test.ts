import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser): TrpcContext {
  const ctx: TrpcContext = {
    user: user || null,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return ctx;
}

describe("Onboarding Flow", () => {
  it("should create a checkout session with valid inputs", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.createCheckout({
      email: "test@example.com",
      tier: "starter",
      userId: 123,
      origin: "https://test.example.com",
    });

    expect(result).toHaveProperty("sessionUrl");
    expect(result).toHaveProperty("sessionId");
    expect(result.sessionUrl).toBeTruthy();
    expect(result.sessionId).toBeTruthy();
  });

  it("should reject invalid email format", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.onboarding.createCheckout({
        email: "invalid-email",
        tier: "starter",
        userId: 123,
        origin: "https://test.example.com",
      })
    ).rejects.toThrow();
  });

  it("should reject invalid tier", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.onboarding.createCheckout({
        email: "test@example.com",
        tier: "invalid" as any,
        userId: 123,
        origin: "https://test.example.com",
      })
    ).rejects.toThrow();
  });
});

describe("Dashboard Access", () => {
  it("should allow authenticated users to access dashboard status", async () => {
    const user: AuthenticatedUser = {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.getStatus();

    expect(result).toHaveProperty("subscription");
    expect(result).toHaveProperty("instance");
    expect(result).toHaveProperty("billingRecords");
  });

  it("should reject unauthenticated users from dashboard", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.dashboard.getStatus()).rejects.toThrow();
  });
});
