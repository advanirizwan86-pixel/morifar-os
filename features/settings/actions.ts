"use server";
import {revalidatePath} from "next/cache";
import {getDb} from "@/server/db";
import {requireSession} from "@/features/auth/session";
import {
  aiPrincipleKeys,
  coreServiceOptions,
  defaultCompanyProfile,
  enabledCountryOptions,
  type CompanyProfile,
} from "@/features/settings/company-profile";
import {saveCompanyProfile} from "@/server/repositories/company-profile";
export type SettingsState={saved?:boolean;error?:string};
export async function saveCompanySettings(_:SettingsState,form:FormData):Promise<SettingsState>{const user=await requireSession();if(!["Super Admin","CEO","COO"].includes(user.role))return{error:"You do not have permission to update company settings."};const name=String(form.get("name")??"").trim(),timezone=String(form.get("timezone")??""),currency=String(form.get("currency")??""),language=String(form.get("language")??"");if(!name||!timezone||!currency||!language)return{error:"All company settings are required."};getDb().prepare("INSERT INTO settings (key,value,updated_at) VALUES ('company',?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").run(JSON.stringify({name,timezone,currency,language}));revalidatePath("/settings");return{saved:true}}

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function selections(form: FormData, key: string, allowed: readonly string[]) {
  return form.getAll(key).map(String).filter(value => allowed.includes(value));
}

export async function saveCompanyProfileAction(_: SettingsState, form: FormData): Promise<SettingsState> {
  const user = await requireSession();
  if (!["Super Admin", "CEO"].includes(user.role)) return {error: "Only Super Admin and CEO roles can update the Company Profile."};

  const profile: CompanyProfile = {
    basic: {
      companyName: text(form, "companyName"),
      legalName: text(form, "legalName"),
      displayName: text(form, "displayName"),
      tagline: text(form, "tagline"),
      industry: text(form, "industry"),
      headquartersCountry: text(form, "headquartersCountry"),
      headquartersCity: text(form, "headquartersCity"),
      timeZone: text(form, "timeZone"),
      defaultCurrency: text(form, "defaultCurrency"),
      defaultLanguage: text(form, "defaultLanguage"),
      secondaryLanguage: text(form, "secondaryLanguage"),
      dateFormat: text(form, "dateFormat"),
      numberFormat: text(form, "numberFormat"),
    },
    contact: {
      website: text(form, "website"),
      generalEmail: text(form, "generalEmail"),
      supportEmail: text(form, "supportEmail"),
      phone: text(form, "phone"),
      whatsApp: text(form, "whatsApp"),
      officeAddress: text(form, "officeAddress"),
      googleMapsLink: text(form, "googleMapsLink"),
      businessHours: text(form, "businessHours"),
    },
    branding: {
      logoUploadPlaceholder: defaultCompanyProfile.branding.logoUploadPlaceholder,
      darkLogoPlaceholder: defaultCompanyProfile.branding.darkLogoPlaceholder,
      lightLogoPlaceholder: defaultCompanyProfile.branding.lightLogoPlaceholder,
      faviconPlaceholder: defaultCompanyProfile.branding.faviconPlaceholder,
      primaryColor: text(form, "primaryColor") || defaultCompanyProfile.branding.primaryColor,
      secondaryColor: text(form, "secondaryColor") || defaultCompanyProfile.branding.secondaryColor,
      accentColor: text(form, "accentColor") || defaultCompanyProfile.branding.accentColor,
      backgroundColor: text(form, "backgroundColor") || defaultCompanyProfile.branding.backgroundColor,
    },
    identity: {
      about: text(form, "about"),
      internalMission: text(form, "internalMission"),
      visionStatement: text(form, "visionStatement"),
      customerPromise: text(form, "customerPromise"),
      coreValues: text(form, "coreValues"),
    },
    enabledCountries: selections(form, "enabledCountries", enabledCountryOptions),
    coreServices: selections(form, "coreServices", coreServiceOptions),
    aiOperatingPrinciples: {
      assistNotReplace: text(form, "ai_assistNotReplace"),
      recommendationsRequireExplanation: text(form, "ai_recommendationsRequireExplanation"),
      sensitiveDecisionsRequireHumanApproval: text(form, "ai_sensitiveDecisionsRequireHumanApproval"),
      aiGeneratedContentLabelled: text(form, "ai_aiGeneratedContentLabelled"),
      humanAccountabilityFinal: text(form, "ai_humanAccountabilityFinal"),
    },
  };

  if (!profile.basic.companyName || !profile.basic.legalName || !profile.basic.displayName || !profile.basic.timeZone) {
    return {error: "Company name, legal name, display name and time zone are required."};
  }
  if (!profile.identity.about) return {error: "About Morifar is required."};
  if (profile.enabledCountries.length === 0) return {error: "Select at least one enabled country."};
  if (profile.coreServices.length === 0) return {error: "Select at least one core service."};
  if (aiPrincipleKeys.some(key => !profile.aiOperatingPrinciples[key])) {
    return {error: "All AI operating principles must contain clear guidance."};
  }

  saveCompanyProfile(profile);
  revalidatePath("/settings");
  revalidatePath("/settings/company-profile");
  return {saved: true};
}
