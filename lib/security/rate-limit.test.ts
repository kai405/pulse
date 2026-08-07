import { beforeEach, describe, expect, it } from "vitest";
import { consumeRateLimit, requestRateLimitKey, resetRateLimitsForTests } from "@/lib/security/rate-limit";

describe("rate limiting", () => {
  beforeEach(resetRateLimitsForTests);

  it("allows a bounded number of calls and reports the retry window", () => {
    expect(consumeRateLimit("auth:one", 2, 10_000, 1_000).allowed).toBe(true);
    expect(consumeRateLimit("auth:one", 2, 10_000, 2_000).allowed).toBe(true);
    expect(consumeRateLimit("auth:one", 2, 10_000, 3_000)).toEqual({ allowed: false, retryAfterSeconds: 8 });
  });

  it("resets an expired bucket", () => {
    consumeRateLimit("auth:two", 1, 1_000, 1_000);
    expect(consumeRateLimit("auth:two", 1, 1_000, 2_001).allowed).toBe(true);
  });

  it("prefers trusted edge address headers", () => {
    const request = new Request("https://pulse.test", { headers: { "cf-connecting-ip": "203.0.113.1", "x-forwarded-for": "198.51.100.1" } });
    expect(requestRateLimitKey(request, "guest")).toBe("guest:203.0.113.1");
  });
});
