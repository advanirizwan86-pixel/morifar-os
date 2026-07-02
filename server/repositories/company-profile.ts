import "server-only";
import {getDb} from "@/server/db";
import {defaultCompanyProfile, type CompanyProfile} from "@/features/settings/company-profile";

const settingKey = "company_profile";

function mergeProfile(value: Partial<CompanyProfile>): CompanyProfile {
  return {
    basic: {...defaultCompanyProfile.basic, ...(value.basic ?? {})},
    contact: {...defaultCompanyProfile.contact, ...(value.contact ?? {})},
    branding: {...defaultCompanyProfile.branding, ...(value.branding ?? {})},
    identity: {...defaultCompanyProfile.identity, ...(value.identity ?? {})},
    enabledCountries: Array.isArray(value.enabledCountries) ? value.enabledCountries : defaultCompanyProfile.enabledCountries,
    coreServices: Array.isArray(value.coreServices) ? value.coreServices : defaultCompanyProfile.coreServices,
    aiOperatingPrinciples: {
      ...defaultCompanyProfile.aiOperatingPrinciples,
      ...(value.aiOperatingPrinciples ?? {}),
    },
  };
}

export function getCompanyProfile(): CompanyProfile {
  const row = getDb().prepare("SELECT value FROM settings WHERE key=?").get(settingKey) as {value: string} | undefined;
  if (!row) return defaultCompanyProfile;
  try {
    return mergeProfile(JSON.parse(row.value) as Partial<CompanyProfile>);
  } catch {
    return defaultCompanyProfile;
  }
}

export function saveCompanyProfile(profile: CompanyProfile) {
  getDb()
    .prepare(
      "INSERT INTO settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP",
    )
    .run(settingKey, JSON.stringify(profile));
}

