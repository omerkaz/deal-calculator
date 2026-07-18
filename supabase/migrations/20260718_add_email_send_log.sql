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
