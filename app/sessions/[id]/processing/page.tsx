import type { Metadata } from "next";
import { ProcessingStatus } from "@/components/processing-status";

export const metadata: Metadata = { title: "Analyzing session" };

export default async function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProcessingStatus sessionId={id} />;
}
