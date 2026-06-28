// Supabase Edge Function: ManyChat Webhook Receiver
// Receives ManyChat External Request POSTs, validates shared-secret auth,
// maps subscriber data to patient fields, and upserts a Lead patient.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS headers ──
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Helpers ──

/** Map ManyChat gender string to schema enum or null */
function mapGender(raw: string | null | undefined): "male" | "female" | "other" | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (lower === "male") return "male";
  if (lower === "female") return "female";
  if (lower.length > 0) return "other";
  return null;
}

/** Extract bearer token from Authorization header */
function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/** Build a JSON Response with CORS headers */
function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Main handler ──

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Method guard
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  // ── Environment validation ──
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  const practitionerUserId = Deno.env.get("PRACTITIONER_USER_ID");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[manychat-webhook] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  if (!webhookSecret) {
    console.error("[manychat-webhook] Missing WEBHOOK_SECRET env var");
    return jsonResponse({ error: "Server configuration error: webhook secret not configured" }, 500);
  }

  if (!practitionerUserId) {
    console.error("[manychat-webhook] Missing PRACTITIONER_USER_ID env var");
    return jsonResponse({ error: "Server configuration error: practitioner user not configured" }, 500);
  }

  // ── Secret validation ──
  // Accept secret via Authorization: Bearer <secret> header or ?secret=<value> query param
  const authHeader = req.headers.get("authorization");
  const bearerToken = extractBearerToken(authHeader);
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");

  const providedSecret = bearerToken || querySecret;

  if (!providedSecret || providedSecret !== webhookSecret) {
    console.warn("[manychat-webhook] Auth failed: invalid or missing secret");
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // ── Parse body ──
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Request body must be a JSON object" }, 400);
  }

  // ── Validate required field ──
  const manychatId = body.id;
  if (manychatId === undefined || manychatId === null || String(manychatId).trim() === "") {
    return jsonResponse({ error: "Missing required field: id (ManyChat subscriber ID)" }, 400);
  }

  // ── Map ManyChat fields to patient columns ──
  const firstName = typeof body.first_name === "string" && body.first_name.trim()
    ? body.first_name.trim()
    : "ManyChat";

  const lastName = typeof body.last_name === "string" && body.last_name.trim()
    ? body.last_name.trim()
    : "Lead";

  const email = typeof body.email === "string" && body.email.trim()
    ? body.email.trim()
    : null;

  const phoneNumber = typeof body.phone === "string" && body.phone.trim()
    ? body.phone.trim()
    : "unknown";

  const instagramUsername = typeof body.ig_username === "string" && body.ig_username.trim()
    ? body.ig_username.trim()
    : null;

  const gender = mapGender(typeof body.gender === "string" ? body.gender : null);

  const language = typeof body.language === "string" && body.language.trim()
    ? body.language.trim().substring(0, 5).toLowerCase()
    : "tr";

  const patientData = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone_country_code: "+00",
    phone_number: phoneNumber,
    gender,
    language,
    lifecycle_state: "lead",
    manychat_id: String(manychatId),
    instagram_username: instagramUsername,
    created_by: practitionerUserId,
  };

  // ── Supabase admin client (bypasses RLS) ──
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Upsert: insert new or update existing by manychat_id unique constraint
    const { data, error } = await supabase
      .from("patients")
      .upsert(patientData, { onConflict: "manychat_id" })
      .select("id, manychat_id")
      .single();

    if (error) {
      console.error("[manychat-webhook] DB upsert failed:", error.message, error.details);
      return jsonResponse({ error: "Failed to create patient" }, 500);
    }

    // Determine if this was a create or update by checking if created_at ~ now
    // The upsert always returns the row, so we query to check.
    // Supabase upsert with onConflict returns the row regardless — we use a
    // secondary check: query the patient's created_at vs updated_at.
    const { data: patient } = await supabase
      .from("patients")
      .select("created_at, updated_at")
      .eq("id", data.id)
      .single();

    const isNew = patient && patient.created_at === patient.updated_at;
    const status = isNew ? "created" : "updated";
    const httpStatus = isNew ? 201 : 200;

    console.log(`[manychat-webhook] Patient ${status}: id=${data.id}, manychat_id=${data.manychat_id}`);

    return jsonResponse(
      { status, patient_id: data.id, manychat_id: data.manychat_id },
      httpStatus,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[manychat-webhook] Unexpected error:", message);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
