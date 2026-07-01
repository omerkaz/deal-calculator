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
        html: `<p>Dear ${params.firstName},</p><p>Thank you for registering with Hüseyin Ajuz. We will be in touch shortly to guide you through your personalised hair loss treatment journey.</p><p>Warm regards,<br>Hüseyin Ajuz</p>`,
        text: `Dear ${params.firstName}, Thank you for registering with Hüseyin Ajuz. We will be in touch shortly. Warm regards, Hüseyin Ajuz`,
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
