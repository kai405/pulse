import type { Metadata } from "next";
import { OnboardingForm } from "@/components/onboarding-form";

export const metadata: Metadata = { title: "Set up your practice" };

export default function OnboardingPage() { return <OnboardingForm />; }
