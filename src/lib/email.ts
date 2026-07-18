import { supabase } from "@/lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

/**
 * Sends a welcome email for a newly created patient via the send-email Edge Function.
 * Uses the current session JWT — no WEBHOOK_SECRET exposure in the browser.
 * Silently skips if email is null or if the feature toggle is off.
 */
export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
}): Promise<void> {
  if (!SUPABASE_URL) {
    console.warn("[email] sendWelcomeEmail skipped: VITE_SUPABASE_URL not set");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("[email] sendWelcomeEmail skipped: no active session");
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        feature: "welcome_email",
        to: params.to,
        subject: "Welcome — Hüseyin Ajuz Hair Loss Consultation",
        html: `<p>Dear ${params.firstName},</p><p>Thank you for registering with Hüseyin Ajuz. We will be in touch shortly to guide you through your personalised hair loss treatment journey.</p>`,
        text: `Dear ${params.firstName},\n\nThank you for registering with Hüseyin Ajuz. We will be in touch shortly to guide you through your personalised hair loss treatment journey.`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] sendWelcomeEmail error: status=${res.status} body=${body}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] sendWelcomeEmail error: ${message}`);
  }
}

type LifecycleReminderFeature = "blood_test_reminder" | "week_6_checkin" | "end_review";

function buildReminderContent(
  feature: LifecycleReminderFeature,
  firstName: string
): { subject: string; html: string } {
  switch (feature) {
    case "blood_test_reminder":
      return {
        subject: "Blood Test Reminder",
        html: `<p>Dear ${firstName},</p><p>Please arrange your blood test at your earliest convenience. Your results are an important part of your personalised treatment plan.</p>`,
      };
    case "week_6_checkin":
      return {
        subject: "Week 6 Check-in",
        html: `<p>Dear ${firstName},</p><p>Your 6-week check-in is due. Please reach out so we can review your progress and adjust your treatment plan if needed.</p>`,
      };
    case "end_review":
      return {
        subject: "End Review",
        html: `<p>Dear ${firstName},</p><p>Your treatment end review is approaching. Please get in touch to schedule your final consultation and discuss next steps.</p>`,
      };
  }
}

/**
 * Sends a lifecycle reminder email via the send-email Edge Function.
 * Covers blood-test, week-6, and end-review reminder types.
 * Errors are swallowed — caller receives void.
 */
export async function sendLifecycleReminderEmail(params: {
  to: string;
  feature: LifecycleReminderFeature;
  patientFirstName: string;
}): Promise<void> {
  if (!SUPABASE_URL) {
    console.warn("[email] sendLifecycleReminderEmail skipped: VITE_SUPABASE_URL not set");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("[email] sendLifecycleReminderEmail skipped: no active session");
    return;
  }

  const { subject, html } = buildReminderContent(params.feature, params.patientFirstName);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        feature: params.feature,
        to: params.to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] sendLifecycleReminderEmail error: feature=${params.feature} status=${res.status} body=${body}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] sendLifecycleReminderEmail error: feature=${params.feature} ${message}`);
  }
}
