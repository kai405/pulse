import type { Metadata } from "next";
import { Suspense } from "react";
import { PracticeSetup } from "@/components/practice-setup";

export const metadata: Metadata = { title: "New practice" };

export default function PracticePage() { return <Suspense fallback={<div className="surface h-96 animate-pulse" />}><PracticeSetup /></Suspense>; }
