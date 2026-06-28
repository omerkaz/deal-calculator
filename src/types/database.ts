// ── Lifecycle States ──

export const LIFECYCLE_STATES = [
  "lead",
  "contacted",
  "awaiting_blood_test",
  "active_treatment",
  "week_6_checkin",
  "end_review",
  "extended_support",
  "completed",
  "cold",
] as const;

export type LifecycleState = (typeof LIFECYCLE_STATES)[number];

export const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  lead: "Lead",
  contacted: "Contacted",
  awaiting_blood_test: "Awaiting Blood Test",
  active_treatment: "Active Treatment",
  week_6_checkin: "Week 6 Check-in",
  end_review: "End Review",
  extended_support: "Extended Support",
  completed: "Completed",
  cold: "Cold",
};

export const VALID_TRANSITIONS: Record<LifecycleState, readonly LifecycleState[]> = {
  lead: ["contacted", "cold"],
  contacted: ["awaiting_blood_test", "cold"],
  awaiting_blood_test: ["active_treatment", "cold"],
  active_treatment: ["week_6_checkin", "cold"],
  week_6_checkin: ["end_review", "extended_support", "cold"],
  end_review: ["completed", "extended_support", "cold"],
  extended_support: ["end_review", "completed", "cold"],
  completed: [],
  cold: ["lead"],
};

// ── Package Types ──

export const PACKAGE_TYPES = ["standard", "premium", "vip"] as const;

export type PackageType = (typeof PACKAGE_TYPES)[number];

// ── Languages ──

export const LANGUAGES = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

// ── Patient ──

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_country_code: string;
  phone_number: string;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  language: LanguageCode;
  country: string | null;
  lifecycle_state: LifecycleState;
  package_type: PackageType | null;
  notes_text: string | null;
  manychat_id: string | null;
  instagram_username: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type PatientInsert = Omit<Patient, "id" | "created_at" | "updated_at" | "manychat_id" | "instagram_username"> & {
  manychat_id?: string | null;
  instagram_username?: string | null;
};
export type PatientUpdate = Partial<Omit<Patient, "id" | "created_at" | "updated_at" | "created_by">>;

// ── Patient Note ──

export interface PatientNote {
  id: string;
  patient_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export type PatientNoteInsert = Omit<PatientNote, "id" | "created_at">;

// ── Patient Attachment ──

export interface PatientAttachment {
  id: string;
  patient_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

export type PatientAttachmentInsert = Omit<PatientAttachment, "id" | "created_at">;

// ── Payment Methods ──

export const PAYMENT_METHODS = ["paypal", "bank_transfer"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  paypal: "PayPal",
  bank_transfer: "Bank Transfer",
};

// ── Package Prices (USD) ──

export const PACKAGE_PRICES: Record<PackageType, number> = {
  standard: 197,
  premium: 297,
  vip: 497,
};

// ── Payment ──

export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface PaymentSummary {
  totalPaid: number;
  status: PaymentStatus;
  paymentCount: number;
}

export interface Payment {
  id: string;
  patient_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_date: string;
  reference: string | null;
  created_by: string;
  created_at: string;
}

export type PaymentInsert = Omit<Payment, "id" | "created_at">;
