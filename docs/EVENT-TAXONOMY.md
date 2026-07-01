# Event Taxonomy: Hüseyin Ajuz Patient CRM

**Product:** Single-user patient management CRM for a trichologist (hair loss consultant). Online practice via Instagram → ManyChat → WhatsApp. Replaces manual Google Drive / DM tracking with structured lifecycle management, payment recording, and automated email workflows.  
**User:** Hüseyin Ajuz (sole practitioner). Patients are the "customers."  
**Analytics Tool:** General (no provider selected yet)  
**Generated:** 2026-07-01

> **Framing note:** In a single-user CRM the practitioner is the sole "user" and patients are the domain objects. LAMERS stages map to: **L** = patient acquisition into the system, **A** = practitioner feature adoption & daily workflows, **M** = payment recording for patient packages, **E** = CRM errors & friction, **R/S** = implicit (measured via session frequency and not applicable, respectively).

---

## 1. Events & Event Properties

### LEAD (Patient Acquisition & Practitioner Auth)

| Status | Source | Event Name | Event Description | Property Name | Property Description | Data Type | Example Values | Comments |
|--------|--------|------------|-------------------|---------------|----------------------|-----------|----------------|----------|
| ⚪ | Frontend | Login Start | Practitioner initiated login. Fires on: LoginPage form submission | — | — | — | — | Single user — still track for session analytics |
| ⚪ | Server-side | Login Complete | Practitioner authenticated successfully. Fires on: Supabase `onAuthStateChange` SIGNED_IN | Login Method | Auth method used | enum | `email` | Only email/password for now |
| | | | | Session ID | Unique session identifier | string | `sess_abc123` | |
| ⚪ | Frontend | Login Fail | Login attempt failed. Fires on: Supabase auth error response | Error Message | Auth error returned | string | `Invalid login credentials` | Track to detect brute-force or forgotten password |
| ⚪ | Frontend | Logout | Practitioner signed out. Fires on: sidebar logout action | Session Duration | Time since login (seconds) | number | `3600` | |
| ⚪ | Server-side | Patient Create | New patient record created. Fires on: successful INSERT into patients table | Patient ID | UUID of created patient | string | `a1b2c3d4-...` | |
| | | | | Source | How the patient was created | enum | `manual`, `manychat_webhook` | Key acquisition channel metric |
| | | | | Lifecycle State | Initial state assigned | enum | `lead` | Always "lead" for new patients |
| | | | | Package Type | Package assigned at creation | enum | `standard`, `premium`, `vip`, `null` | Null if not yet assigned |
| | | | | Language | Patient language | enum | `tr`, `en`, `de`, `fr`, `ar`, `ru`, `es`, `nl` | |
| | | | | Country | Patient country | string | `Germany`, `Turkey` | |
| | | | | Has Email | Whether email was provided | boolean | `true` | Affects email workflow eligibility |
| | | | | Has Instagram | Whether Instagram handle was provided | boolean | `true` | |
| ⚪ | Server-side | Webhook Receive | ManyChat webhook hit the Edge Function. Fires on: every POST to manychat-webhook | ManyChat ID | ManyChat subscriber ID | string | `12345678` | |
| | | | | Action | Whether patient was created or updated | enum | `insert`, `update` | Upsert by manychat_id |
| | | | | Auth Method | How the webhook authenticated | enum | `bearer_token`, `query_secret` | |
| | | | | Success | Whether upsert succeeded | boolean | `true` | |
| | | | | Error Message | Error if failed | string | `Missing required fields` | Null on success |

### ACTIVATION / ENGAGEMENT (Practitioner Feature Usage)

| Status | Source | Event Name | Event Description | Property Name | Property Description | Data Type | Example Values | Comments |
|--------|--------|------------|-------------------|---------------|----------------------|-----------|----------------|----------|
| ⚪ | Frontend | Page View | Practitioner navigated to a page. Fires on: every route change | Page Name | Human-readable page name | enum | `Dashboard`, `Patients`, `Patient Detail`, `Pipeline`, `Payments`, `New Patient`, `Edit Patient` | |
| | | | | Page Path | URL path | string | `/patients/abc123` | |
| | | | | Patient ID | Patient UUID if on a patient page | string | `a1b2c3d4-...` | Null for non-patient pages |
| ⚪ | Server-side | State Transition | Patient lifecycle state changed. Fires on: successful `transitionState()` call | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | From State | Previous lifecycle state | enum | `lead`, `contacted`, ... | |
| | | | | To State | New lifecycle state | enum | `contacted`, `awaiting_blood_test`, ... | |
| | | | | Is Forward | Whether transition moves toward completion | boolean | `true` | False for → cold transitions |
| | | | | Time In Previous State | Days spent in the previous state | number | `4.5` | Derived from `updated_at` delta; key efficiency metric |
| ⚪ | Frontend | Patient Search | Practitioner searched for patients. Fires on: search input debounce (300ms+) | Query | Search text entered | string | `mehmet` | |
| | | | | Results Count | Number of patients returned | number | `3` | 0 results = potential data gap |
| ⚪ | Frontend | Patient Filter Apply | Practitioner applied list filters. Fires on: filter select change | Filter Type | Which filter was changed | enum | `status`, `package_type` | |
| | | | | Filter Value | Value selected | string | `active_treatment`, `premium` | |
| | | | | Results Count | Filtered result count | number | `8` | |
| ⚪ | Frontend | Patient View | Practitioner opened a patient detail page. Fires on: PatientDetailPage mount | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Lifecycle State | Current state of the patient | enum | `active_treatment` | |
| | | | | Package Type | Patient's package | enum | `premium`, `null` | |
| | | | | Payment Status | Derived payment status | enum | `paid`, `partial`, `unpaid` | |
| ⚪ | Frontend | Patient Edit | Practitioner updated patient information. Fires on: successful PatientFormPage submit (edit mode) | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Fields Changed | Which fields were modified | array | `["phone_number", "package_type"]` | Track what gets corrected most |
| ⚪ | Server-side | Note Create | Practitioner added a clinical note. Fires on: successful note INSERT | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Content Length | Character count of the note | number | `245` | Proxy for note depth |
| | | | | Patient State | Patient's current lifecycle state | enum | `active_treatment` | Which stages generate the most notes |
| ⚪ | Server-side | Note Delete | Practitioner deleted a clinical note. Fires on: successful note DELETE | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Note ID | UUID of the deleted note | string | `n1n2n3-...` | |
| ⚪ | Server-side | File Upload | Practitioner uploaded a patient file. Fires on: successful Storage upload + metadata INSERT | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | File Type | MIME type of the file | string | `image/jpeg`, `application/pdf` | |
| | | | | File Size | Size in bytes | number | `2048000` | Track storage usage |
| | | | | File Name | Original filename | string | `blood_test_results.pdf` | |
| ⚪ | Frontend | File Download | Practitioner downloaded/viewed a patient file. Fires on: signed URL generated | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | File Type | MIME type | string | `application/pdf` | |
| ⚪ | Server-side | File Delete | Practitioner deleted a patient file. Fires on: successful Storage delete + metadata DELETE | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | File Type | MIME type of the deleted file | string | `image/jpeg` | |
| ⚪ | Frontend | Pipeline View | Practitioner viewed the Kanban pipeline. Fires on: PipelinePage mount | Stage Counts | Patient count per stage | string | `{"lead":5,"contacted":3,...}` | JSON-encoded snapshot |
| | | | | Total Patients | Total patients across all stages | number | `24` | |
| ⚪ | Frontend | Dashboard View | Practitioner viewed the dashboard. Fires on: DashboardPage mount | Active Clients | Count of active patients | number | `12` | |
| | | | | Revenue This Month | Current month revenue (USD) | number | `1485.00` | |
| | | | | Revenue Total | All-time revenue (USD) | number | `8910.00` | |

### MONETIZATION (Payment Recording & Revenue)

| Status | Source | Event Name | Event Description | Property Name | Property Description | Data Type | Example Values | Comments |
|--------|--------|------------|-------------------|---------------|----------------------|-----------|----------------|----------|
| ⚪ | Server-side | Payment Record | Practitioner recorded a patient payment. Fires on: successful payment INSERT | Payment ID | UUID of the payment | string | `p1p2p3-...` | |
| | | | | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Amount | Payment amount | number | `197.00` | |
| | | | | Currency | Payment currency | enum | `USD`, `EUR` | |
| | | | | Payment Method | How payment was received | enum | `paypal`, `bank_transfer` | |
| | | | | Package Type | Patient's package at time of payment | enum | `standard`, `premium`, `vip`, `null` | |
| | | | | Package Price | Expected total for the package | number | `297.00` | Null if no package assigned |
| | | | | Running Total | Cumulative amount paid by this patient | number | `394.00` | After this payment |
| | | | | Resulting Status | Payment status after this recording | enum | `paid`, `partial`, `unpaid` | Derived from running total vs package price |
| | | | | Patient State | Patient's current lifecycle state | enum | `active_treatment` | When in the journey do payments land |
| ⚪ | Server-side | Payment Delete | Practitioner deleted a payment record. Fires on: successful payment DELETE | Payment ID | UUID of the deleted payment | string | `p1p2p3-...` | |
| | | | | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Amount | Deleted payment amount | number | `100.00` | |
| | | | | Resulting Status | Payment status after deletion | enum | `partial`, `unpaid` | |
| ⚪ | Frontend | Payments Page Filter | Practitioner filtered the payments list. Fires on: filter change on PaymentsPage | Filter Type | Which filter was applied | enum | `patient`, `method` | |
| | | | | Filter Value | Selected value | string | `paypal` | |

### SATISFACTION (Experience Quality & Errors)

| Status | Source | Event Name | Event Description | Property Name | Property Description | Data Type | Example Values | Comments |
|--------|--------|------------|-------------------|---------------|----------------------|-----------|----------------|----------|
| ⚪ | Frontend | Error Occur | A user-facing error was displayed. Fires on: error toast/message render | Page | Page where error occurred | string | `/patients/new` | |
| | | | | Operation | What action failed | enum | `patient_create`, `patient_update`, `state_transition`, `payment_create`, `file_upload`, `file_download`, `file_delete`, `note_create`, `login` | |
| | | | | Error Message | Error text shown to user | string | `Failed to create patient` | |
| | | | | Patient ID | Patient context if applicable | string | `a1b2c3d4-...` | Null for non-patient operations |
| ⚪ | Frontend | Transition Blocked | Practitioner attempted an invalid state transition. Fires on: transition button disabled or rejected | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Current State | Patient's current state | enum | `completed` | |
| | | | | Attempted State | State they tried to transition to | enum | `active_treatment` | |
| | | | | Reason | Why it was blocked | enum | `invalid_transition`, `concurrent_update` | Optimistic concurrency conflict = data issue |
| ⚪ | Frontend | Slow Load | A page or data fetch took >3 seconds. Fires on: load time exceeding threshold | Page | Which page was slow | string | `/patients` | |
| | | | | Duration | Load time in milliseconds | number | `4500` | |
| | | | | Data Source | What was being loaded | enum | `patients_list`, `patient_detail`, `payments`, `dashboard_metrics`, `pipeline` | |
| ⚪ | Server-side | Webhook Error | ManyChat webhook returned a non-200 response. Fires on: Edge Function error | Error Type | Category of failure | enum | `auth_failed`, `validation_error`, `db_error`, `unknown` | |
| | | | | Status Code | HTTP status returned | number | `401`, `400`, `500` | |
| | | | | Error Message | Error detail | string | `Invalid bearer token` | |

### LIFECYCLE EMAIL EVENTS (M002 — Planned)

| Status | Source | Event Name | Event Description | Property Name | Property Description | Data Type | Example Values | Comments |
|--------|--------|------------|-------------------|---------------|----------------------|-----------|----------------|----------|
| ⚪ | Server-side | Email Send | System sent an automated email. Fires on: successful Resend API call from Edge Function | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Email Type | Category of email sent | enum | `welcome`, `blood_test_reminder`, `week_6_reminder`, `end_review_reminder`, `lead_followup_day3`, `lead_followup_day7`, `lead_followup_day12` | |
| | | | | Patient Email | Recipient address | string | `patient@example.com` | For deliverability tracking |
| | | | | Patient State | Patient's lifecycle state at send time | enum | `lead`, `awaiting_blood_test` | |
| | | | | Template ID | Resend template used | string | `tmpl_welcome_v1` | Version tracking |
| | | | | Success | Whether Resend accepted the request | boolean | `true` | |
| ⚪ | Server-side | Email Fail | Automated email failed to send. Fires on: Resend API error response | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | |
| | | | | Email Type | Which email failed | enum | `welcome`, `blood_test_reminder`, ... | |
| | | | | Error Message | Resend error detail | string | `Invalid recipient` | |
| | | | | Retry Count | Number of attempts so far | number | `2` | |
| ⚪ | Server-side | Auto Cold Transition | System automatically moved a lead to Cold. Fires on: pg_cron job after 12 days of inactivity | Patient ID | UUID of the patient | string | `a1b2c3d4-...` | M002/S05 feature |
| | | | | Days Inactive | Days since last state change | number | `14` | |
| | | | | Followups Sent | Number of follow-up emails sent before transition | number | `3` | |

---

## 2. User Properties

*Properties attached to the practitioner's user profile. Single-user system, but structured for potential multi-practitioner expansion.*

| Status | Property Name | Description | Data Type | Example Values | Comments |
|--------|--------------|-------------|-----------|----------------|----------|
| ⚪ | User ID | Supabase auth.users UUID | string | `usr_abc123` | `PRACTITIONER_USER_ID` env var value |
| ⚪ | Email | Practitioner's email | string | `huseyin@example.com` | Login credential |
| ⚪ | Display Name | Practitioner's display name | string | `Hüseyin Ajuz` | |
| ⚪ | Signup Date | When the auth account was created | unix timestamp | `2025-06-15T10:00:00Z` | |
| ⚪ | Last Login | Most recent login timestamp | unix timestamp | `2026-07-01T08:30:00Z` | Updated on each Login Complete |
| ⚪ | Total Patients | Current patient count | number | `47` | Updated on Patient Create/delete |
| ⚪ | Active Patients | Patients in active treatment states | number | `12` | Derived from 4 active states |
| ⚪ | Total Revenue | All-time recorded revenue (USD) | number | `8910.00` | Updated on Payment Record/Delete |
| ⚪ | Welcome Email Enabled | Whether welcome emails are toggled on | boolean | `true` | M002 settings |
| ⚪ | Reminder Emails Enabled | Whether lifecycle reminders are toggled on | boolean | `true` | M002 settings |
| ⚪ | Lead Followup Enabled | Whether lead follow-up emails are toggled on | boolean | `true` | M002 settings |
| ⚪ | Browser | Browser name | string | `Chrome`, `Safari` | |
| ⚪ | OS | Operating system | string | `macOS`, `Windows` | |
| ⚪ | Screen Resolution | Viewport dimensions | string | `1920x1080` | Informs responsive design needs |
| ⚪ | Timezone | Practitioner's timezone | string | `Europe/Berlin` | Relevant for email scheduling |

---

## 3. Global Event Properties

*Attached to every single event automatically.*

| Status | Property Name | Description | Data Type | Example Values | Comments |
|--------|--------------|-------------|-----------|----------------|----------|
| ⚪ | Page URL | Current page URL (no query params) | string | `https://app.huseyinajuz.com/patients` | |
| ⚪ | Page Location | Full URL with query params | string | `https://app.huseyinajuz.com/patients?status=active_treatment` | |
| ⚪ | Page Path | URL path only | string | `/patients` | |
| ⚪ | Page Name | Human-readable page name | enum | `Dashboard`, `Patients`, `Patient Detail`, `Pipeline`, `Payments`, `Login`, `New Patient`, `Edit Patient` | Derived from route |
| ⚪ | Session ID | Unique session identifier | string | `sess_abc123xyz` | Generated on Login Complete or page load with existing auth |
| ⚪ | Session Number | Practitioner's nth session | number | `142` | Cumulative count |
| ⚪ | Session Event Number | nth event in this session | number | `15` | Resets each session |
| ⚪ | Session Duration | Seconds since session start | number | `1800` | Running timer |
| ⚪ | Timestamp | Event timestamp (ISO 8601) | unix timestamp | `2026-07-01T14:30:45Z` | |
| ⚪ | App Version | CRM build version | string | `1.0.0` | From package.json or build hash |
| ⚪ | Environment | Runtime environment | enum | `production`, `development` | `import.meta.env.MODE` |

---

## Implementation Priority

| Priority | Events | Rationale |
|----------|--------|-----------|
| **P0 — Must have** | `Patient Create`, `State Transition`, `Payment Record`, `Error Occur`, `Webhook Receive` | Core funnel: patient acquisition → lifecycle progression → revenue. Errors catch production issues. Webhook health is critical for the ManyChat pipeline. |
| **P1 — Should have** | `Login Complete`, `Page View`, `Patient View`, `Patient Search`, `File Upload`, `Note Create`, `Email Send`, `Email Fail` | Feature adoption visibility + email workflow monitoring. Answers: "Which pages/features are used?", "Are emails landing?" |
| **P2 — Nice to have** | `Dashboard View`, `Pipeline View`, `Patient Filter Apply`, `Patient Edit`, `Slow Load`, `Transition Blocked`, `File Download`, `File Delete`, `Note Delete`, `Payment Delete`, `Payments Page Filter`, `Auto Cold Transition`, `Login Start`, `Login Fail`, `Logout`, `Webhook Error` | Deep analysis: UX friction, feature engagement patterns, data hygiene. Lower urgency for single-user system. |

---

## Key Metrics These Events Unlock

| Metric | Events Used | Business Question |
|--------|------------|-------------------|
| **Lead → Active conversion rate** | `Patient Create` (source=manychat) → `State Transition` (to=active_treatment) | What % of ManyChat leads become paying clients? |
| **Time-to-activation** | `Patient Create` → first `State Transition` to active_treatment | How many days from lead capture to starting treatment? |
| **Average time per stage** | `State Transition` (Time In Previous State) | Where do patients stall in the pipeline? |
| **Revenue per month** | `Payment Record` (Amount, timestamp) | Is the practice growing? |
| **Package mix** | `Payment Record` (Package Type) | Which package sells most? |
| **Payment method split** | `Payment Record` (Payment Method) | PayPal vs bank transfer preference? |
| **Cold rate** | `State Transition` (to=cold) / total patients | What % of patients go cold, and from which stage? |
| **Re-engagement rate** | `State Transition` (from=cold, to=lead) / cold patients | Does re-engagement work? |
| **Email deliverability** | `Email Send` (Success) vs `Email Fail` | Are automated emails reaching patients? |
| **Webhook reliability** | `Webhook Receive` (Success) vs `Webhook Error` | Is the ManyChat integration healthy? |
| **Feature adoption** | `Page View` (Page Name distribution) | Which CRM features get used daily vs. ignored? |
| **Error frequency** | `Error Occur` (Operation, Page) | What breaks most often? |

---

## Status Legend

| Badge | Meaning |
|-------|---------|
| 🟢 | Implemented — tracking live and verified |
| 🟡 | Needs Fix — exists but has issues |
| ⚪ | Not Implemented — not yet instrumented |

---

## Notes

1. **Single-user system:** Traditional retention/spread (LAMERS R/S) stages are not applicable. Retention is implicit — if Hüseyin logs in daily, the CRM is sticky. Track via `Login Complete` frequency and `Session Number`.
2. **Patient ≠ User:** Patients never log in. All events are from the practitioner's perspective, with `Patient ID` as a property on patient-related actions.
3. **Server-side preference:** Patient Create, State Transition, Payment Record, and Email Send should be server-side events for reliability. Page View, Search, and Filter events are frontend-only.
4. **No PII in event properties:** Patient names and emails should NOT be sent to analytics. Use Patient ID (UUID) for joins. The `Patient Email` property on Email Send is the exception — needed for deliverability debugging but should be hashed if the analytics tool doesn't support PII controls.
5. **M002 events are forward-looking:** Email Send, Email Fail, and Auto Cold Transition events are planned for M002 slices S03–S05. Include in the taxonomy now so implementation is aligned when those features ship.
