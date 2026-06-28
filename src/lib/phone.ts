export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

export const COUNTRY_CODES: readonly CountryCode[] = [
  { code: "TR", dialCode: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
  { code: "NL", dialCode: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "AE", dialCode: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "RU", dialCode: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "ES", dialCode: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "IT", dialCode: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "SE", dialCode: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", dialCode: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "DK", dialCode: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "AT", dialCode: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "CH", dialCode: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "BE", dialCode: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "IE", dialCode: "+353", name: "Ireland", flag: "🇮🇪" },
  { code: "PL", dialCode: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "GR", dialCode: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "PT", dialCode: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "CZ", dialCode: "+420", name: "Czech Republic", flag: "🇨🇿" },
  { code: "RO", dialCode: "+40", name: "Romania", flag: "🇷🇴" },
  { code: "BG", dialCode: "+359", name: "Bulgaria", flag: "🇧🇬" },
  { code: "AZ", dialCode: "+994", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "KZ", dialCode: "+7", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "IL", dialCode: "+972", name: "Israel", flag: "🇮🇱" },
  { code: "IQ", dialCode: "+964", name: "Iraq", flag: "🇮🇶" },
  { code: "KW", dialCode: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "QA", dialCode: "+974", name: "Qatar", flag: "🇶🇦" },
] as const;

/**
 * Format a phone number with its country dial code.
 * Returns "+90 5551234567" style string.
 */
export function formatPhoneWithCode(dialCode: string, number: string): string {
  const cleaned = number.replace(/[^\d]/g, "");
  return `${dialCode} ${cleaned}`;
}

/**
 * Validate that a phone number is reasonable:
 * - dialCode starts with "+"
 * - number is 6-15 digits after stripping non-digit characters
 */
export function isValidPhone(dialCode: string, number: string): boolean {
  if (!dialCode.startsWith("+")) return false;
  const cleaned = number.replace(/[^\d]/g, "");
  return cleaned.length >= 6 && cleaned.length <= 15;
}
