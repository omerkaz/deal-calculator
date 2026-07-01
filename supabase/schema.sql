-- ============================================================
-- Patient Records Schema
-- Huseyinajuz Hair Transplant CRM
-- ============================================================

-- ── Updated-at trigger function ──
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Patients table ──
create table if not exists patients (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone_country_code text not null default '+90',
  phone_number  text not null,
  date_of_birth date,
  gender        text check (gender in ('male', 'female', 'other')),
  language      text not null default 'tr',
  country       text,
  lifecycle_state text not null default 'lead'
    check (lifecycle_state in (
      'lead', 'contacted', 'awaiting_blood_test', 'active_treatment',
      'week_6_checkin', 'end_review', 'extended_support', 'completed', 'cold'
    )),
  package_type  text check (package_type in ('standard', 'premium', 'vip')),
  notes_text    text,
  manychat_id   text unique,
  instagram_username text,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger patients_updated_at
  before update on patients
  for each row execute function update_updated_at();

-- ── Patient notes table ──
create table if not exists patient_notes (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id) on delete cascade,
  content     text not null,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ── Patient attachments table ──
create table if not exists patient_attachments (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients(id) on delete cascade,
  file_name    text not null,
  file_type    text not null,
  file_size    bigint not null,
  storage_path text not null,
  uploaded_by  uuid not null references auth.users(id),
  created_at   timestamptz not null default now()
);

-- ── Indexes ──
create index if not exists idx_patients_lifecycle on patients(lifecycle_state);
create index if not exists idx_patients_created_by on patients(created_by);
create index if not exists idx_patients_name on patients(last_name, first_name);
create index if not exists idx_patient_notes_patient on patient_notes(patient_id);
create index if not exists idx_patient_attachments_patient on patient_attachments(patient_id);

-- ── Row Level Security ──
alter table patients enable row level security;
alter table patient_notes enable row level security;
alter table patient_attachments enable row level security;

-- Patients: users can CRUD their own records
create policy "Users can view own patients"
  on patients for select using (auth.uid() = created_by);

create policy "Users can insert own patients"
  on patients for insert with check (auth.uid() = created_by);

create policy "Users can update own patients"
  on patients for update using (auth.uid() = created_by);

create policy "Users can delete own patients"
  on patients for delete using (auth.uid() = created_by);

-- Patient notes: users can CRUD notes on their own patients
create policy "Users can view own patient notes"
  on patient_notes for select using (auth.uid() = created_by);

create policy "Users can insert own patient notes"
  on patient_notes for insert with check (auth.uid() = created_by);

create policy "Users can delete own patient notes"
  on patient_notes for delete using (auth.uid() = created_by);

-- Patient attachments: users can CRUD attachments on their own patients
create policy "Users can view own patient attachments"
  on patient_attachments for select using (auth.uid() = uploaded_by);

create policy "Users can insert own patient attachments"
  on patient_attachments for insert with check (auth.uid() = uploaded_by);

create policy "Users can delete own patient attachments"
  on patient_attachments for delete using (auth.uid() = uploaded_by);

-- ── Payments table ──
create table payments (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  amount          numeric(10,2) not null,
  currency        text not null default 'USD',
  payment_method  text not null check (payment_method in ('paypal', 'bank_transfer')),
  payment_date    date not null,
  reference       text,
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);

create index if not exists idx_payments_patient on payments(patient_id);

-- ── Payments RLS ──
alter table payments enable row level security;

create policy "Users can view own payments"
  on payments for select using (auth.uid() = created_by);

create policy "Users can insert own payments"
  on payments for insert with check (auth.uid() = created_by);

create policy "Users can delete own payments"
  on payments for delete using (auth.uid() = created_by);

-- ── Storage bucket ──
-- NOTE: Create a 'patient-attachments' bucket in Supabase Dashboard > Storage
-- with RLS policy: auth.uid() = owner
-- Max file size: 10MB
-- Allowed MIME types: image/*, application/pdf

-- ── Practitioner settings table ──
create table if not exists practitioner_settings (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null unique references auth.users(id),
  welcome_email_enabled       boolean not null default false,
  blood_test_reminder_enabled boolean not null default false,
  week_6_checkin_enabled      boolean not null default false,
  end_review_enabled          boolean not null default false,
  lead_day3_enabled           boolean not null default false,
  lead_day7_enabled           boolean not null default false,
  lead_day12_enabled          boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger practitioner_settings_updated_at
  before update on practitioner_settings
  for each row execute function update_updated_at();

alter table practitioner_settings enable row level security;

create policy "Users can view own settings"
  on practitioner_settings for select using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on practitioner_settings for insert with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on practitioner_settings for update using (auth.uid() = user_id);

-- ── state_changed_at migration ──
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state_changed_at TIMESTAMPTZ;
UPDATE patients SET state_changed_at = updated_at WHERE state_changed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_state_changed ON patients(lifecycle_state, state_changed_at);

-- ── M002 S04: Lifecycle reminder pg_cron jobs ──
--
-- PRE-RUN CHECKLIST (Supabase SQL Editor):
--   1. SET app.supabase_functions_url = 'https://hbhepcucokwlagqygwrz.supabase.co/functions/v1';
--      Run this SET before applying the functions below, or the GUC will be NULL and http_post
--      calls will fire to a NULL URL (pg_net silently drops them).
--   2. Ensure WEBHOOK_SECRET is stored in Vault:
--      Supabase Dashboard > Vault > New Secret, name = 'WEBHOOK_SECRET', value = <your secret>
--      The functions read it via vault.decrypted_secrets — never hardcode it in SQL.
--   3. pg_cron and pg_net extensions must be enabled for the project
--      (Supabase Dashboard > Database > Extensions). The guards below are idempotent.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper: send blood-test reminder emails
-- Fires for patients in 'awaiting_blood_test' whose state_changed_at is > 14 days ago.
CREATE OR REPLACE FUNCTION send_blood_test_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _secret  text;
  _url     text;
  _patient RECORD;
  _body    jsonb;
BEGIN
  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  _url := current_setting('app.supabase_functions_url', true) || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'awaiting_blood_test'
       AND state_changed_at < now() - INTERVAL '14 days'
       AND email IS NOT NULL
  LOOP
    _body := jsonb_build_object(
      'feature',      'blood_test_reminder',
      'patient_id',   _patient.id,
      'patient_name', _patient.first_name,
      'patient_email', _patient.email
    );

    PERFORM pg_net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );
  END LOOP;
END;
$$;

-- Helper: send week-6 check-in reminder emails
-- Fires for patients in 'active_treatment' whose state_changed_at is > 42 days ago.
CREATE OR REPLACE FUNCTION send_week6_checkin_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _secret  text;
  _url     text;
  _patient RECORD;
  _body    jsonb;
BEGIN
  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  _url := current_setting('app.supabase_functions_url', true) || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'active_treatment'
       AND state_changed_at < now() - INTERVAL '42 days'
       AND email IS NOT NULL
  LOOP
    _body := jsonb_build_object(
      'feature',       'week_6_checkin',
      'patient_id',    _patient.id,
      'patient_name',  _patient.first_name,
      'patient_email', _patient.email
    );

    PERFORM pg_net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );
  END LOOP;
END;
$$;

-- Helper: send end-review reminder emails
-- Fires for patients in 'week_6_checkin' whose state_changed_at is > 7 days ago.
CREATE OR REPLACE FUNCTION send_end_review_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _secret  text;
  _url     text;
  _patient RECORD;
  _body    jsonb;
BEGIN
  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  _url := current_setting('app.supabase_functions_url', true) || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'week_6_checkin'
       AND state_changed_at < now() - INTERVAL '7 days'
       AND email IS NOT NULL
  LOOP
    _body := jsonb_build_object(
      'feature',       'end_review',
      'patient_id',    _patient.id,
      'patient_name',  _patient.first_name,
      'patient_email', _patient.email
    );

    PERFORM pg_net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );
  END LOOP;
END;
$$;

-- Register the three daily cron jobs (idempotent: unschedule first if they exist)
DO $$
BEGIN
  -- blood-test-reminders
  PERFORM cron.unschedule('blood-test-reminders');
  EXCEPTION WHEN others THEN NULL;
END;
$$;
SELECT cron.schedule('blood-test-reminders', '0 8 * * *', 'SELECT send_blood_test_reminders();');

DO $$
BEGIN
  PERFORM cron.unschedule('week6-checkin-reminders');
  EXCEPTION WHEN others THEN NULL;
END;
$$;
SELECT cron.schedule('week6-checkin-reminders', '0 8 * * *', 'SELECT send_week6_checkin_reminders();');

DO $$
BEGIN
  PERFORM cron.unschedule('end-review-reminders');
  EXCEPTION WHEN others THEN NULL;
END;
$$;
SELECT cron.schedule('end-review-reminders', '0 8 * * *', 'SELECT send_end_review_reminders();');
