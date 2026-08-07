import type { Metadata } from "next";
import { RecordingStudio } from "@/components/recording-studio";

export const metadata: Metadata = { title: "Recording studio" };

export default function StudioPage() { return <RecordingStudio />; }
