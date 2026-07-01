import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { getSettings, upsertSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/types/database";
import type { PractitionerSettings } from "@/types/database";
import { Card } from "@/components/ui";

type SettingsState = Omit<PractitionerSettings, "id" | "user_id" | "created_at" | "updated_at">;

const TOGGLE_ROWS: { key: keyof SettingsState; label: string; description: string }[] = [
  {
    key: "welcome_email_enabled",
    label: "Welcome Email",
    description: "Send a welcome email when a new patient is created.",
  },
  {
    key: "blood_test_reminder_enabled",
    label: "Blood Test Reminder",
    description: "Remind patients to complete their blood test when they reach that stage.",
  },
  {
    key: "week_6_checkin_enabled",
    label: "Week 6 Check-in",
    description: "Send a check-in email when a patient enters Week 6 Check-in.",
  },
  {
    key: "end_review_enabled",
    label: "End Review",
    description: "Notify patients when their treatment is entering the end review stage.",
  },
  {
    key: "lead_day3_enabled",
    label: "Lead Follow-up Day 3",
    description: "Send a follow-up message 3 days after a lead is created.",
  },
  {
    key: "lead_day7_enabled",
    label: "Lead Follow-up Day 7",
    description: "Send a follow-up message 7 days after a lead is created.",
  },
  {
    key: "lead_day12_enabled",
    label: "Lead Follow-up Day 12",
    description: "Send a final follow-up 12 days after a lead is created, then mark cold.",
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsState>({ ...DEFAULT_SETTINGS });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggleErrors, setToggleErrors] = useState<Partial<Record<keyof SettingsState, string>>>({});

  useEffect(() => {
    if (!user) return;
    getSettings(user.id).then(({ data, error }) => {
      if (error) {
        setLoadError(error.message);
        return;
      }
      if (data) {
        setSettings({
          welcome_email_enabled: data.welcome_email_enabled,
          blood_test_reminder_enabled: data.blood_test_reminder_enabled,
          week_6_checkin_enabled: data.week_6_checkin_enabled,
          end_review_enabled: data.end_review_enabled,
          lead_day3_enabled: data.lead_day3_enabled,
          lead_day7_enabled: data.lead_day7_enabled,
          lead_day12_enabled: data.lead_day12_enabled,
        });
      }
    });
  }, [user]);

  async function handleToggle(key: keyof SettingsState) {
    if (!user) return;
    const prev = settings[key];
    const next = !prev;

    setSettings((s) => ({ ...s, [key]: next }));
    setToggleErrors((e) => ({ ...e, [key]: undefined }));

    const { error } = await upsertSettings(user.id, { [key]: next });
    if (error) {
      setSettings((s) => ({ ...s, [key]: prev }));
      setToggleErrors((e) => ({ ...e, [key]: "Save failed. Please try again." }));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-heading text-2xl text-text mb-1">Settings</h1>
      <p className="text-sm text-text-secondary mb-6">
        Toggle automation features on or off without a code deploy.
      </p>

      {loadError && (
        <div className="mb-4 rounded-[10px] bg-coral/10 px-4 py-3 text-sm text-coral">
          {loadError}
        </div>
      )}

      <Card className="divide-y divide-divider">
        <div className="px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Automation Features
          </p>
        </div>
        {TOGGLE_ROWS.map(({ key, label, description }) => {
          const enabled = settings[key];
          return (
            <div key={key} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{description}</p>
                {toggleErrors[key] && (
                  <p className="text-xs text-coral mt-1">{toggleErrors[key]}</p>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={label}
                onClick={() => handleToggle(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${
                  enabled ? "bg-teal" : "bg-text-muted"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
