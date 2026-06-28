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
  on patient_attachments for select using (auth.uid() = created_by);

create policy "Users can insert own patient attachments"
  on patient_attachments for insert with check (auth.uid() = created_by);

create policy "Users can delete own patient attachments"
  on patient_attachments for delete using (auth.uid() = created_by);

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
