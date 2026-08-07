import { createClient } from "@supabase/supabase-js";
import { PRACTICE_PROMPTS } from "../lib/prompts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });
const rows = PRACTICE_PROMPTS.map((prompt) => ({ id: prompt.id, mode: prompt.mode, category: prompt.category, difficulty: prompt.difficulty, prompt_text: prompt.text, guidance: prompt.guidance, active: true }));
if (process.argv.includes("--reset")) await supabase.from("practice_prompts").delete().neq("id", "");
const { error } = await supabase.from("practice_prompts").upsert(rows, { onConflict: "id" });
if (error) throw error;
console.log(`Seeded ${rows.length} curated prompts. Demo session fixtures remain code-only and clearly labeled.`);
