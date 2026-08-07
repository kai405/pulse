create extension if not exists pgcrypto;

create type public.session_status as enum (
  'draft', 'recording', 'uploading', 'queued', 'transcribing', 'measuring',
  'evaluating', 'finalizing', 'completed', 'partial', 'incomplete', 'failed'
);

create type public.practice_mode as enum ('impromptu', 'interview', 'presentation', 'elevator-pitch');
create type public.metric_confidence as enum ('high', 'medium', 'low');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  goal text not null default 'clarity',
  experience_level text not null default 'beginner' check (experience_level in ('beginner', 'regular', 'advanced')),
  preferred_mode public.practice_mode not null default 'impromptu',
  target_wpm integer not null default 140 check (target_wpm between 80 and 220),
  weekly_session_goal integer not null default 3 check (weekly_session_goal between 1 and 7),
  media_retention_days integer not null default 30 check (media_retention_days between 1 and 30),
  onboarding_completed_at timestamptz,
  guest_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trigger_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phrase text not null check (char_length(phrase) between 1 and 80),
  normalized_phrase text not null check (char_length(normalized_phrase) between 1 and 80),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_phrase)
);

create table public.practice_prompts (
  id text primary key,
  mode public.practice_mode not null,
  category text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  prompt_text text not null check (char_length(prompt_text) between 1 and 1000),
  guidance text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rubric_versions (
  version text primary key,
  compatibility_major integer not null,
  definition jsonb not null,
  published_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_id text references public.practice_prompts(id) on delete set null,
  prompt_snapshot text not null check (char_length(prompt_snapshot) between 1 and 1000),
  mode public.practice_mode not null,
  category text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  target_seconds integer not null check (target_seconds between 15 and 600),
  preparation_seconds integer not null default 30 check (preparation_seconds between 0 and 60),
  target_wpm integer not null check (target_wpm between 80 and 220),
  video_enabled boolean not null default true,
  recording_duration_seconds numeric(8,3),
  speaking_duration_seconds numeric(8,3),
  status public.session_status not null default 'draft',
  current_stage text,
  failure_code text,
  failure_message text,
  retry_count integer not null default 0,
  rubric_version text not null references public.rubric_versions(version),
  active_analysis_version integer not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index practice_sessions_user_created_idx on public.practice_sessions (user_id, created_at desc);
create index practice_sessions_status_idx on public.practice_sessions (status) where status not in ('completed', 'incomplete');

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.practice_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  audio_path text,
  video_path text,
  audio_mime text,
  video_mime text,
  audio_bytes bigint check (audio_bytes >= 0),
  video_bytes bigint check (video_bytes >= 0),
  duration_seconds numeric(8,3),
  capture_metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default (now() + interval '30 days'),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_version integer not null,
  transcript_text text not null,
  provider text not null,
  model_id text not null,
  language text,
  confidence public.metric_confidence not null default 'medium',
  source_hash text,
  created_at timestamptz not null default now(),
  unique (session_id, analysis_version)
);

create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ordinal integer not null,
  start_ms integer not null check (start_ms >= 0),
  end_ms integer not null check (end_ms >= start_ms),
  text text not null,
  confidence numeric(4,3),
  words jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (transcript_id, ordinal)
);

create table public.visual_samples (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp_ms integer not null check (timestamp_ms >= 0),
  local_confidence public.metric_confidence not null default 'low',
  measurements jsonb not null default '{}'::jsonb,
  frame_path text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index visual_samples_session_time_idx on public.visual_samples (session_id, timestamp_ms);

create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_version integer not null,
  rubric_version text not null references public.rubric_versions(version),
  evaluator_prompt_version text not null,
  model_id text,
  overall_score integer check (overall_score between 0 and 100),
  category_scores jsonb not null default '{}'::jsonb,
  summary text,
  strongest_dimension text,
  priority_improvement text,
  next_action text,
  confidence_summary jsonb not null default '{}'::jsonb,
  missing_metrics text[] not null default '{}',
  threshold_snapshot jsonb not null,
  aggregation_metadata jsonb not null default '{}'::jsonb,
  raw_structured_output jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, analysis_version)
);

create table public.metric_results (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analysis_results(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_key text not null,
  category text not null,
  numeric_value numeric,
  text_value text,
  unit text,
  score integer check (score between 0 and 100),
  confidence public.metric_confidence not null,
  available boolean not null,
  unavailable_reason text,
  threshold jsonb,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (analysis_id, metric_key)
);

create table public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analysis_results(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('strength', 'improvement', 'recommendation', 'limitation')),
  category text,
  priority integer not null default 0,
  title text not null,
  explanation text not null,
  action text,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.practice_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_analysis_id uuid references public.analysis_results(id) on delete cascade,
  skill_key text not null,
  priority integer not null,
  title text not null,
  exercise_config jsonb not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.practice_sessions(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger prompts_updated before update on public.practice_prompts for each row execute function public.set_updated_at();
create trigger sessions_updated before update on public.practice_sessions for each row execute function public.set_updated_at();
create trigger recordings_updated before update on public.recordings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, guest_expires_at)
  values (new.id, case when new.is_anonymous then now() + interval '7 days' else null end)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.rubric_versions (version, compatibility_major, definition)
values ('pulse-1.0.0', 1, '{"weights":{"delivery":25,"fluency":20,"content":30,"visual":15,"confidence":10}}'::jsonb)
on conflict (version) do nothing;

alter table public.profiles enable row level security;
alter table public.trigger_words enable row level security;
alter table public.practice_prompts enable row level security;
alter table public.rubric_versions enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.recordings enable row level security;
alter table public.transcripts enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.visual_samples enable row level security;
alter table public.analysis_results enable row level security;
alter table public.metric_results enable row level security;
alter table public.feedback_items enable row level security;
alter table public.practice_recommendations enable row level security;
alter table public.product_events enable row level security;

create policy profiles_owner_all on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy triggers_owner_all on public.trigger_words for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy prompts_authenticated_read on public.practice_prompts for select to authenticated using (active);
create policy rubrics_authenticated_read on public.rubric_versions for select to authenticated using (true);
create policy sessions_owner_all on public.practice_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy recordings_owner_read on public.recordings for select using (auth.uid() = user_id);
create policy transcripts_owner_read on public.transcripts for select using (auth.uid() = user_id);
create policy segments_owner_read on public.transcript_segments for select using (auth.uid() = user_id);
create policy visual_samples_owner_read on public.visual_samples for select using (auth.uid() = user_id);
create policy analyses_owner_read on public.analysis_results for select using (auth.uid() = user_id);
create policy metrics_owner_read on public.metric_results for select using (auth.uid() = user_id);
create policy feedback_owner_read on public.feedback_items for select using (auth.uid() = user_id);
create policy recommendations_owner_all on public.practice_recommendations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy events_owner_insert on public.product_events for insert with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('recordings', 'recordings', false, 157286400, array['audio/webm','audio/mp4','audio/mpeg','audio/wav','video/webm','video/mp4']),
  ('analysis-frames', 'analysis-frames', false, 2097152, array['image/jpeg'])
on conflict (id) do update set public = false;

create policy recording_owner_read on storage.objects for select to authenticated using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy recording_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy recording_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy frame_owner_read on storage.objects for select to authenticated using (bucket_id = 'analysis-frames' and (storage.foldername(name))[1] = auth.uid()::text);
create policy frame_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'analysis-frames' and (storage.foldername(name))[1] = auth.uid()::text);
create policy frame_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'analysis-frames' and (storage.foldername(name))[1] = auth.uid()::text);
