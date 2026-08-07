export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationship[];
};

type Owned = { id: string; user_id: string; created_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        user_id: string; display_name: string | null; goal: string; experience_level: string;
        preferred_mode: Database["public"]["Enums"]["practice_mode"]; target_wpm: number;
        weekly_session_goal: number; media_retention_days: number; onboarding_completed_at: string | null;
        guest_expires_at: string | null; created_at: string; updated_at: string;
      }>;
      trigger_words: Table<Owned & { phrase: string; normalized_phrase: string; enabled: boolean }>;
      practice_prompts: Table<{ id: string; mode: Database["public"]["Enums"]["practice_mode"]; category: string; difficulty: string; prompt_text: string; guidance: string; active: boolean; created_at: string; updated_at: string }>;
      rubric_versions: Table<{ version: string; compatibility_major: number; definition: Json; published_at: string }>;
      practice_sessions: Table<Owned & {
        prompt_id: string | null; prompt_snapshot: string; mode: Database["public"]["Enums"]["practice_mode"];
        category: string; difficulty: string; target_seconds: number; preparation_seconds: number; target_wpm: number;
        video_enabled: boolean; recording_duration_seconds: number | null; speaking_duration_seconds: number | null;
        status: Database["public"]["Enums"]["session_status"]; current_stage: string | null; failure_code: string | null;
        failure_message: string | null; retry_count: number; rubric_version: string; active_analysis_version: number;
        completed_at: string | null; updated_at: string;
      }, {
        id?: string; user_id: string; prompt_id?: string | null; prompt_snapshot: string; mode: Database["public"]["Enums"]["practice_mode"];
        category: string; difficulty: string; target_seconds: number; preparation_seconds: number; target_wpm: number;
        video_enabled: boolean; recording_duration_seconds?: number | null; speaking_duration_seconds?: number | null;
        status?: Database["public"]["Enums"]["session_status"]; current_stage?: string | null; failure_code?: string | null;
        failure_message?: string | null; retry_count?: number; rubric_version: string; active_analysis_version?: number;
        completed_at?: string | null; created_at?: string; updated_at?: string;
      }>;
      recordings: Table<Owned & {
        session_id: string; audio_path: string | null; video_path: string | null; audio_mime: string | null; video_mime: string | null;
        audio_bytes: number | null; video_bytes: number | null; duration_seconds: number | null; capture_metadata: Json;
        expires_at: string; deleted_at: string | null; updated_at: string;
      }, {
        id?: string; session_id: string; user_id: string; audio_path?: string | null; video_path?: string | null;
        audio_mime?: string | null; video_mime?: string | null; audio_bytes?: number | null; video_bytes?: number | null;
        duration_seconds?: number | null; capture_metadata?: Json; expires_at?: string; deleted_at?: string | null; created_at?: string; updated_at?: string;
      }>;
      transcripts: Table<Owned & { session_id: string; analysis_version: number; transcript_text: string; provider: string; model_id: string; language: string | null; confidence: Database["public"]["Enums"]["metric_confidence"]; source_hash: string | null }, {
        id?: string; session_id: string; user_id: string; analysis_version: number; transcript_text: string; provider: string; model_id: string; language?: string | null; confidence?: Database["public"]["Enums"]["metric_confidence"]; source_hash?: string | null; created_at?: string;
      }>;
      transcript_segments: Table<Owned & { transcript_id: string; ordinal: number; start_ms: number; end_ms: number; text: string; confidence: number | null; words: Json }, {
        id?: string; transcript_id: string; user_id: string; ordinal: number; start_ms: number; end_ms: number; text: string; confidence?: number | null; words?: Json; created_at?: string;
      }>;
      visual_samples: Table<Owned & { session_id: string; timestamp_ms: number; local_confidence: Database["public"]["Enums"]["metric_confidence"]; measurements: Json; frame_path: string | null; expires_at: string }, {
        id?: string; session_id: string; user_id: string; timestamp_ms: number; local_confidence?: Database["public"]["Enums"]["metric_confidence"]; measurements?: Json; frame_path?: string | null; expires_at?: string; created_at?: string;
      }>;
      analysis_results: Table<Owned & {
        session_id: string; analysis_version: number; rubric_version: string; evaluator_prompt_version: string; model_id: string | null;
        overall_score: number | null; category_scores: Json; summary: string | null; strongest_dimension: string | null;
        priority_improvement: string | null; next_action: string | null; confidence_summary: Json; missing_metrics: string[];
        threshold_snapshot: Json; aggregation_metadata: Json; raw_structured_output: Json | null;
      }, {
        id?: string; session_id: string; user_id: string; analysis_version: number; rubric_version: string; evaluator_prompt_version: string;
        model_id?: string | null; overall_score?: number | null; category_scores?: Json; summary?: string | null; strongest_dimension?: string | null;
        priority_improvement?: string | null; next_action?: string | null; confidence_summary?: Json; missing_metrics?: string[];
        threshold_snapshot: Json; aggregation_metadata?: Json; raw_structured_output?: Json | null; created_at?: string;
      }>;
      metric_results: Table<Owned & { analysis_id: string; metric_key: string; category: string; numeric_value: number | null; text_value: string | null; unit: string | null; score: number | null; confidence: Database["public"]["Enums"]["metric_confidence"]; available: boolean; unavailable_reason: string | null; threshold: Json | null; evidence: Json }, {
        id?: string; analysis_id: string; user_id: string; metric_key: string; category: string; numeric_value?: number | null; text_value?: string | null; unit?: string | null; score?: number | null; confidence: Database["public"]["Enums"]["metric_confidence"]; available: boolean; unavailable_reason?: string | null; threshold?: Json | null; evidence?: Json; created_at?: string;
      }>;
      feedback_items: Table<Owned & { analysis_id: string; item_type: string; category: string | null; priority: number; title: string; explanation: string; action: string | null; evidence: Json }, {
        id?: string; analysis_id: string; user_id: string; item_type: string; category?: string | null; priority?: number; title: string; explanation: string; action?: string | null; evidence?: Json; created_at?: string;
      }>;
      practice_recommendations: Table<Owned & { source_analysis_id: string | null; skill_key: string; priority: number; title: string; exercise_config: Json; completed_at: string | null }>;
      product_events: Table<{ id: number; user_id: string | null; session_id: string | null; event_name: string; properties: Json; created_at: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      practice_mode: "impromptu" | "interview" | "presentation" | "elevator-pitch";
      session_status: "draft" | "recording" | "uploading" | "queued" | "transcribing" | "measuring" | "evaluating" | "finalizing" | "completed" | "partial" | "incomplete" | "failed";
      metric_confidence: "high" | "medium" | "low";
    };
    CompositeTypes: Record<string, never>;
  };
};
