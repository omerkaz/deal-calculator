-- Migration: Add email_send_log table for at-least-once reminder delivery
-- (MAIL-02, Phase 14)
-- Idempotent: safe to run multiple times.

-- ── Email send tracking log ──

CREATE TABLE IF NOT EXISTS email_send_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  feature     text NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_send_log_patient_feature
  ON email_send_log(patient_id, feature);

ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'email_send_log'
       AND policyname = 'Users can view email send log'
  ) THEN
    CREATE POLICY "Users can view email send log"
      ON email_send_log FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
      );
  END IF;
END $$;

-- ── Rewrite cron functions for at-least-once delivery ──
-- All 6 reminder functions now use NOT EXISTS against email_send_log
-- instead of BETWEEN windows. CREATE OR REPLACE is idempotent.

-- Helper: send blood-test reminder emails (at-least-once)
-- Fires for patients in 'awaiting_blood_test' ≥14 days after entering the state,
-- if no email_send_log record exists for this lifecycle run.
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
  _enabled boolean;
BEGIN
  SELECT (blood_test_reminder_enabled IS TRUE) INTO _enabled
    FROM practitioner_settings
   LIMIT 1;

  IF NOT COALESCE(_enabled, false) THEN
    RAISE NOTICE '[send_blood_test_reminders] feature=blood_test_reminder enabled=false skipped';
    RETURN;
  END IF;

  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets
   WHERE name = 'SUPABASE_FUNCTIONS_URL'
   LIMIT 1;

  _url := _url || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'awaiting_blood_test'
       AND COALESCE(state_changed_at, created_at) <= now() - INTERVAL '14 days'
       AND email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM email_send_log esl
          WHERE esl.patient_id = patients.id
            AND esl.feature = 'blood_test_reminder'
            AND esl.sent_at >= COALESCE(patients.state_changed_at, patients.created_at)
       )
  LOOP
    _body := jsonb_build_object(
      'feature', 'blood_test_reminder',
      'to',      _patient.email,
      'subject', 'Blood Test Reminder',
      'html',    '<p>Dear ' || _patient.first_name || ',</p><p>Please arrange your blood test at your earliest convenience. Your results are an important part of your personalised treatment plan.</p><p>Warm regards,<br>Hüseyin Ajuz</p>'
    );

    PERFORM net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );

    INSERT INTO email_send_log (patient_id, feature)
    VALUES (_patient.id, 'blood_test_reminder');
  END LOOP;
END;
$$;

-- Helper: send week-6 check-in reminder emails (at-least-once)
-- Fires for patients in 'active_treatment' ≥42 days after entering the state,
-- if no email_send_log record exists for this lifecycle run.
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
  _enabled boolean;
BEGIN
  SELECT (week_6_checkin_enabled IS TRUE) INTO _enabled
    FROM practitioner_settings
   LIMIT 1;

  IF NOT COALESCE(_enabled, false) THEN
    RAISE NOTICE '[send_week6_checkin_reminders] feature=week_6_checkin enabled=false skipped';
    RETURN;
  END IF;

  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets
   WHERE name = 'SUPABASE_FUNCTIONS_URL'
   LIMIT 1;

  _url := _url || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'active_treatment'
       AND COALESCE(state_changed_at, created_at) <= now() - INTERVAL '42 days'
       AND email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM email_send_log esl
          WHERE esl.patient_id = patients.id
            AND esl.feature = 'week_6_checkin'
            AND esl.sent_at >= COALESCE(patients.state_changed_at, patients.created_at)
       )
  LOOP
    _body := jsonb_build_object(
      'feature', 'week_6_checkin',
      'to',      _patient.email,
      'subject', 'Week 6 Check-in',
      'html',    '<p>Dear ' || _patient.first_name || ',</p><p>Your 6-week check-in is due. Please reach out so we can review your progress and adjust your treatment plan if needed.</p><p>Warm regards,<br>Hüseyin Ajuz</p>'
    );

    PERFORM net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );

    INSERT INTO email_send_log (patient_id, feature)
    VALUES (_patient.id, 'week_6_checkin');
  END LOOP;
END;
$$;

-- Helper: send end-review reminder emails (at-least-once)
-- Fires for patients in 'week_6_checkin' ≥7 days after entering the state,
-- if no email_send_log record exists for this lifecycle run.
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
  _enabled boolean;
BEGIN
  SELECT (end_review_enabled IS TRUE) INTO _enabled
    FROM practitioner_settings
   LIMIT 1;

  IF NOT COALESCE(_enabled, false) THEN
    RAISE NOTICE '[send_end_review_reminders] feature=end_review enabled=false skipped';
    RETURN;
  END IF;

  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets
   WHERE name = 'SUPABASE_FUNCTIONS_URL'
   LIMIT 1;

  _url := _url || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'week_6_checkin'
       AND COALESCE(state_changed_at, created_at) <= now() - INTERVAL '7 days'
       AND email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM email_send_log esl
          WHERE esl.patient_id = patients.id
            AND esl.feature = 'end_review'
            AND esl.sent_at >= COALESCE(patients.state_changed_at, patients.created_at)
       )
  LOOP
    _body := jsonb_build_object(
      'feature', 'end_review',
      'to',      _patient.email,
      'subject', 'End Review',
      'html',    '<p>Dear ' || _patient.first_name || ',</p><p>Your treatment end review is approaching. Please get in touch to schedule your final consultation and discuss next steps.</p><p>Warm regards,<br>Hüseyin Ajuz</p>'
    );

    PERFORM net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );

    INSERT INTO email_send_log (patient_id, feature)
    VALUES (_patient.id, 'end_review');
  END LOOP;
END;
$$;

-- Helper: send Day-3 follow-up email to leads (at-least-once)
-- Fires for leads ≥3 days after entering lead state,
-- if no email_send_log record exists for this lifecycle run.
CREATE OR REPLACE FUNCTION notify_lead_day3()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _secret  text;
  _url     text;
  _patient RECORD;
  _body    jsonb;
  _enabled boolean;
BEGIN
  SELECT (lead_day3_enabled IS TRUE) INTO _enabled
    FROM practitioner_settings
   LIMIT 1;

  IF NOT COALESCE(_enabled, false) THEN
    RAISE NOTICE '[notify_lead_day3] feature=lead_day3 enabled=false skipped';
    RETURN;
  END IF;

  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets
   WHERE name = 'SUPABASE_FUNCTIONS_URL'
   LIMIT 1;

  _url := _url || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'lead'
       AND COALESCE(state_changed_at, created_at) <= now() - INTERVAL '3 days'
       AND email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM email_send_log esl
          WHERE esl.patient_id = patients.id
            AND esl.feature = 'lead_day3'
            AND esl.sent_at >= COALESCE(patients.state_changed_at, patients.created_at)
       )
  LOOP
    _body := jsonb_build_object(
      'feature', 'lead_day3',
      'to',      _patient.email,
      'subject', 'Following up on your hair loss consultation',
      'html',    '<p>Hi ' || _patient.first_name || ',</p><p>I wanted to follow up on your interest in our hair loss consultation programme. I''d love to help you understand what''s causing your hair loss and put together a personalised plan for you.</p><p>Feel free to reply to this email or reach out via WhatsApp to book a slot.</p><p>Best,<br>Hüseyin Ajuz</p>'
    );

    PERFORM net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );

    INSERT INTO email_send_log (patient_id, feature)
    VALUES (_patient.id, 'lead_day3');
  END LOOP;
END;
$$;

-- Helper: send Day-7 follow-up email to leads (at-least-once)
-- Fires for leads ≥7 days after entering lead state,
-- if no email_send_log record exists for this lifecycle run.
CREATE OR REPLACE FUNCTION notify_lead_day7()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _secret  text;
  _url     text;
  _patient RECORD;
  _body    jsonb;
  _enabled boolean;
BEGIN
  SELECT (lead_day7_enabled IS TRUE) INTO _enabled
    FROM practitioner_settings
   LIMIT 1;

  IF NOT COALESCE(_enabled, false) THEN
    RAISE NOTICE '[notify_lead_day7] feature=lead_day7 enabled=false skipped';
    RETURN;
  END IF;

  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets
   WHERE name = 'SUPABASE_FUNCTIONS_URL'
   LIMIT 1;

  _url := _url || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'lead'
       AND COALESCE(state_changed_at, created_at) <= now() - INTERVAL '7 days'
       AND email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM email_send_log esl
          WHERE esl.patient_id = patients.id
            AND esl.feature = 'lead_day7'
            AND esl.sent_at >= COALESCE(patients.state_changed_at, patients.created_at)
       )
  LOOP
    _body := jsonb_build_object(
      'feature', 'lead_day7',
      'to',      _patient.email,
      'subject', 'Still thinking about your hair loss? Here''s what we can do',
      'html',    '<p>Hi ' || _patient.first_name || ',</p><p>A week has passed since you first reached out. Hair loss can be tricky to address without the right guidance — that''s exactly what we specialise in.</p><p>If you have any questions before booking, just hit reply. I''m happy to chat.</p><p>Best,<br>Hüseyin Ajuz</p>'
    );

    PERFORM net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );

    INSERT INTO email_send_log (patient_id, feature)
    VALUES (_patient.id, 'lead_day7');
  END LOOP;
END;
$$;

-- Helper: send Day-12 follow-up email to leads (at-least-once)
-- Fires for leads ≥12 days after entering lead state,
-- if no email_send_log record exists for this lifecycle run.
CREATE OR REPLACE FUNCTION notify_lead_day12()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _secret  text;
  _url     text;
  _patient RECORD;
  _body    jsonb;
  _enabled boolean;
BEGIN
  SELECT (lead_day12_enabled IS TRUE) INTO _enabled
    FROM practitioner_settings
   LIMIT 1;

  IF NOT COALESCE(_enabled, false) THEN
    RAISE NOTICE '[notify_lead_day12] feature=lead_day12 enabled=false skipped';
    RETURN;
  END IF;

  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets
   WHERE name = 'WEBHOOK_SECRET'
   LIMIT 1;

  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets
   WHERE name = 'SUPABASE_FUNCTIONS_URL'
   LIMIT 1;

  _url := _url || '/send-email';

  FOR _patient IN
    SELECT id, first_name, email
      FROM patients
     WHERE lifecycle_state = 'lead'
       AND COALESCE(state_changed_at, created_at) <= now() - INTERVAL '12 days'
       AND email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM email_send_log esl
          WHERE esl.patient_id = patients.id
            AND esl.feature = 'lead_day12'
            AND esl.sent_at >= COALESCE(patients.state_changed_at, patients.created_at)
       )
  LOOP
    _body := jsonb_build_object(
      'feature', 'lead_day12',
      'to',      _patient.email,
      'subject', 'Last chance to book your consultation',
      'html',    '<p>Hi ' || _patient.first_name || ',</p><p>This is my final follow-up. I don''t want to overwhelm your inbox — but I did want to make sure you hadn''t missed us.</p><p>If you''re still interested in understanding and tackling your hair loss, I''d love to help. Just reply and we''ll take it from there.</p><p>Best,<br>Hüseyin Ajuz</p>'
    );

    PERFORM net.http_post(
      url     := _url,
      body    := _body,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _secret
      )
    );

    INSERT INTO email_send_log (patient_id, feature)
    VALUES (_patient.id, 'lead_day12');
  END LOOP;
END;
$$;

-- Helper: auto-transition stale leads to cold state
-- Fires for all leads whose COALESCE(state_changed_at, created_at) is older than 12 days.
