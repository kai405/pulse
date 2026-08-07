import { describe, expect, it } from "vitest";
import { POST as createSession } from "@/app/api/sessions/route";
import { GET as getStatus } from "@/app/api/sessions/[id]/status/route";
import { POST as sendMagicLink } from "@/app/api/auth/magic-link/route";
import { PATCH as updateProfile } from "@/app/api/profile/route";
import { GET as runRetention } from "@/app/api/cron/retention/route";

const validSession = { config: { mode: "impromptu", category: "Everyday Life", difficulty: "intermediate", promptId: null, prompt: "Describe a useful change.", targetSeconds: 120, preparationSeconds: 30, videoEnabled: false }, durationSeconds: 60, audio: { mime: "audio/webm", bytes: 1000 }, video: null, frameTimestamps: [] };

describe("API boundary behavior without hosted credentials", () => {
  it("validates input before touching providers", async () => {
    const response = await createSession(new Request("http://localhost/api/sessions", { method: "POST", body: "{}", headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(400);
  });

  it("returns an honest configuration failure for real persistence", async () => {
    const response = await createSession(new Request("http://localhost/api/sessions", { method: "POST", body: JSON.stringify(validSession), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(503);
  });

  it("does not leak session status when persistence is unavailable", async () => {
    const response = await getStatus(new Request("http://localhost"), { params: Promise.resolve({ id: "another-users-id" }) });
    expect(response.status).toBe(503);
  });

  it("validates email and retains a useful no-key failure", async () => {
    const invalid = await sendMagicLink(new Request("http://localhost", { method: "POST", body: JSON.stringify({ email: "bad" }) }));
    const valid = await sendMagicLink(new Request("http://localhost", { method: "POST", body: JSON.stringify({ email: "speaker@example.com" }) }));
    expect(invalid.status).toBe(400);
    expect(valid.status).toBe(503);
  });

  it("keeps onboarding usable in browser-only fallback mode", async () => {
    const response = await updateProfile(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ displayName: "Speaker", goal: "clarity", experience: "beginner", preferredMode: "impromptu", targetWpm: 140, weeklyGoal: 3, triggerWords: [], onboardingCompleted: true }) }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ stored: "browser" });
  });

  it("protects retention automation", async () => {
    const response = await runRetention(new Request("http://localhost/api/cron/retention"));
    expect(response.status).toBe(401);
  });
});
