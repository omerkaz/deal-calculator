import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { useAuth } from "@/context/auth";
import { createPatient, getPatient, updatePatient } from "@/lib/patients";
import { COUNTRY_CODES, isValidPhone } from "@/lib/phone";
import { LANGUAGES, PACKAGE_TYPES } from "@/types/database";
import type { LanguageCode, PackageType } from "@/types/database";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  submit?: string;
}

export default function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  // ── Form state ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+90");
  const [phone, setPhone] = useState("");

  const [language, setLanguage] = useState<LanguageCode>("tr");
  const [packageType, setPackageType] = useState<PackageType | "">("standard");

  // ── UI state ──
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Load existing patient for edit mode ──
  const loadPatient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);

    const { data, error } = await getPatient(id);

    if (error || !data) {
      setFetchError(error?.message ?? "Patient not found.");
      setLoading(false);
      return;
    }

    setFirstName(data.first_name);
    setLastName(data.last_name);
    setEmail(data.email ?? "");
    setPhoneCountryCode(
      COUNTRY_CODES.find((c) => c.dialCode === data.phone_country_code)
        ? data.phone_country_code
        : "+90",
    );
    setPhone(data.phone_number);

    setLanguage(data.language);
    setPackageType(data.package_type ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      void loadPatient();
    }
  }, [isEdit, loadPatient]);

  // ── Validation ──
  function validate(): FormErrors {
    const next: FormErrors = {};

    if (!firstName.trim()) {
      next.firstName = "First name is required.";
    }
    if (!lastName.trim()) {
      next.lastName = "Last name is required.";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (phone.trim() && !isValidPhone(phoneCountryCode, phone)) {
      next.phone = "Phone number must be 6–15 digits.";
    }

    return next;
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null,
      phone_country_code: phoneCountryCode,
      phone_number: phone.trim(),
      language,
      package_type: (packageType || null) as PackageType | null,
    };

    if (isEdit && id) {
      const { data, error } = await updatePatient(id, payload);
      if (error || !data) {
        setErrors({ submit: error?.message ?? "Failed to update patient." });
        setSubmitting(false);
        return;
      }
      void navigate(`/patients/${data.id}`);
    } else {
      const { data, error } = await createPatient({
        ...payload,
        date_of_birth: null,
        gender: null,
        country: null,
        lifecycle_state: "lead",
        notes_text: null,
        created_by: user?.id ?? "",
      });
      if (error || !data) {
        setErrors({ submit: error?.message ?? "Failed to create patient." });
        setSubmitting(false);
        return;
      }
      void navigate(`/patients/${data.id}`);
    }
  }

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
        <span className="ml-3 text-text-secondary">Loading patient…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => void navigate("/patients")}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to patients
        </button>
        <Card hover={false}>
          <p className="text-coral">{fetchError}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => void navigate("/patients")}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="font-heading text-2xl text-text">
          {isEdit ? "Edit Patient" : "New Patient"}
        </h1>
      </div>

      {/* Form */}
      <Card hover={false}>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {/* Submit error banner */}
          {errors.submit && (
            <div className="rounded-lg bg-coral/10 border border-coral/30 px-4 py-3 text-sm text-coral">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* First Name */}
            <Input
              label="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={errors.firstName}
              placeholder="Enter first name"
            />

            {/* Last Name */}
            <Input
              label="Last Name *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors.lastName}
              placeholder="Enter last name"
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="patient@example.com"
            />

            {/* Phone — country code + number */}
            <div className="md:col-span-2">
              <label className="block text-[0.78rem] font-medium text-text-secondary mb-1.5">
                Phone Number
              </label>
              <div className="grid grid-cols-[160px_1fr] gap-3">
                <Select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.dialCode}>
                      {c.flag} {c.dialCode}
                    </option>
                  ))}
                </Select>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                  placeholder="5551234567"
                  type="tel"
                />
              </div>
            </div>

            {/* Language */}
            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </Select>

            {/* Package Type */}
            <Select
              label="Package Type"
              value={packageType}
              onChange={(e) => setPackageType(e.target.value as PackageType | "")}
            >
              <option value="">None</option>
              {PACKAGE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-divider">
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
            >
              <Save className="h-4 w-4" />
              {isEdit ? "Save Changes" : "Create Patient"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void navigate("/patients")}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
