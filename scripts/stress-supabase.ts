import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const cronSecret = process.env.CRON_SECRET;
if (!url || !publicKey || !serviceKey || !cronSecret) throw new Error("Local Supabase, service, and cron environment variables are required.");
const supabaseUrl = url;
const supabasePublicKey = publicKey;

const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const nonce = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const password = `Pulse-${crypto.randomUUID()}!`;
const userIds: string[] = [];
let sessionId = "";
let storagePath = "";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function createUser(label: string) {
  const email = `pulse-stress-${label}-${nonce}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("Synthetic user creation failed.");
  userIds.push(data.user.id);
  const client = createClient(supabaseUrl, supabasePublicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { client, id: data.user.id };
}

async function cleanup() {
  if (storagePath) await admin.storage.from("recordings").remove([storagePath]);
  if (sessionId) await admin.from("practice_sessions").delete().eq("id", sessionId);
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
}

try {
  const [owner, outsider] = await Promise.all([createUser("owner"), createUser("outsider")]);
  const ownerProfile = await owner.client.from("profiles").select("user_id").eq("user_id", owner.id).maybeSingle();
  assert(ownerProfile.data?.user_id === owner.id, "New-user profile trigger did not create the owner profile.");

  const insert = await owner.client.from("practice_sessions").insert({ user_id: owner.id, prompt_snapshot: "Synthetic authorization stress session", mode: "impromptu", category: "Stress test", difficulty: "intermediate", target_seconds: 60, preparation_seconds: 0, target_wpm: 140, video_enabled: false, recording_duration_seconds: 12, status: "failed", current_stage: "failed", rubric_version: "pulse-1.0.0" }).select("id").single();
  if (insert.error || !insert.data) throw insert.error ?? new Error("Owner session insert failed.");
  sessionId = insert.data.id;

  const outsiderRead = await outsider.client.from("practice_sessions").select("id").eq("id", sessionId);
  assert(!outsiderRead.error && outsiderRead.data.length === 0, "RLS leaked an owned session to another user.");
  const outsiderUpdate = await outsider.client.from("practice_sessions").update({ current_stage: "tampered" }).eq("id", sessionId).select("id");
  assert(!outsiderUpdate.error && outsiderUpdate.data.length === 0, "RLS allowed another user to update the session.");
  const outsiderDelete = await outsider.client.from("practice_sessions").delete().eq("id", sessionId).select("id");
  assert(!outsiderDelete.error && outsiderDelete.data.length === 0, "RLS allowed another user to delete the session.");

  storagePath = `${owner.id}/${sessionId}/stress-audio.webm`;
  const upload = await owner.client.storage.from("recordings").upload(storagePath, new Blob(["pulse synthetic audio"], { type: "audio/webm" }), { contentType: "audio/webm", upsert: false });
  if (upload.error) throw upload.error;
  const outsiderDownload = await outsider.client.storage.from("recordings").download(storagePath);
  assert(Boolean(outsiderDownload.error), "Private Storage allowed another user to download the recording.");
  const ownerDownload = await owner.client.storage.from("recordings").download(storagePath);
  assert(!ownerDownload.error && (await ownerDownload.data.text()) === "pulse synthetic audio", "Owner could not retrieve the private recording.");

  const concurrentReads = await Promise.all(Array.from({ length: 100 }, () => owner.client.from("practice_sessions").select("id, status").eq("id", sessionId).single()));
  assert(concurrentReads.every((result) => !result.error && result.data.id === sessionId), "One or more concurrent authorized reads failed.");

  const recording = await admin.from("recordings").insert({ session_id: sessionId, user_id: owner.id, audio_path: storagePath, audio_mime: "audio/webm", audio_bytes: 21, duration_seconds: 12, expires_at: new Date(Date.now() - 60_000).toISOString() }).select("id").single();
  if (recording.error) throw recording.error;
  const retention = await fetch(`${appUrl}/api/cron/retention`, { headers: { authorization: `Bearer ${cronSecret}` } });
  const retentionBody = await retention.json() as { mediaDeleted?: number };
  assert(retention.ok && (retentionBody.mediaDeleted ?? 0) >= 1, "Retention route did not delete expired synthetic media.");
  const retainedRecording = await admin.from("recordings").select("audio_path, deleted_at").eq("session_id", sessionId).single();
  assert(retainedRecording.data?.audio_path === null && Boolean(retainedRecording.data.deleted_at), "Retention metadata was not finalized.");
  storagePath = "";

  const promptCount = await owner.client.from("practice_prompts").select("id", { count: "exact", head: true });
  assert(promptCount.count === 60, `Expected 60 prompts, found ${promptCount.count ?? "unknown"}.`);
  console.log(JSON.stringify({ usersCreated: 2, profilesVerified: 1, crossUserReadsBlocked: true, crossUserWritesBlocked: true, privateStorageVerified: true, concurrentAuthorizedReads: concurrentReads.length, retentionVerified: true, promptCount: promptCount.count }, null, 2));
} finally {
  await cleanup();
  const residualUsers = userIds.length ? await admin.from("profiles").select("user_id").in("user_id", userIds) : { data: [] };
  if (residualUsers.data?.length) throw new Error("Synthetic stress users were not fully removed.");
}
