import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { getOwnedSettingsProfile } from "@/lib/db/profile";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() { const { profile, workspace } = await getOwnedSettingsProfile(); return <div><p className="eyebrow">Settings</p><h1 className="mt-3 text-4xl font-[760] tracking-[-0.06em] sm:text-5xl">Practice on your terms.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">Adjust your targets and control what Pulse keeps.</p><div className="mt-8"><SettingsForm initialProfile={profile} workspace={workspace} /></div></div>; }
