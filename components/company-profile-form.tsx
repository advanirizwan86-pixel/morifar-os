"use client";

import {useActionState, useEffect, useMemo, useState} from "react";
import {
  aiPrincipleKeys,
  coreServiceOptions,
  enabledCountryOptions,
  type CompanyProfile,
} from "@/features/settings/company-profile";
import {saveCompanyProfileAction} from "@/features/settings/actions";

const principleLabels: Record<(typeof aiPrincipleKeys)[number], string> = {
  assistNotReplace: "AI must assist, not replace professionals",
  recommendationsRequireExplanation: "AI recommendations require explanation",
  sensitiveDecisionsRequireHumanApproval: "Sensitive decisions require human approval",
  aiGeneratedContentLabelled: "AI-generated content must be clearly labelled",
  humanAccountabilityFinal: "Human accountability remains final",
};

function Field({
  label,
  name,
  defaultValue,
  readOnly,
  required,
  helper,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  readOnly: boolean;
  required?: boolean;
  helper?: string;
  type?: string;
}) {
  return (
    <label>
      <span>{label}{required ? " *" : ""}</span>
      <input name={name} defaultValue={defaultValue} readOnly={readOnly} required={required} type={type} />
      {helper && <em>{helper}</em>}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  readOnly,
  required,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue: string;
  readOnly: boolean;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="full">
      <span>{label}{required ? " *" : ""}</span>
      <textarea name={name} defaultValue={defaultValue} readOnly={readOnly} required={required} rows={rows} />
    </label>
  );
}

export function CompanyProfileForm({profile, canEdit}: {profile: CompanyProfile; canEdit: boolean}) {
  const [state, action, pending] = useActionState(saveCompanyProfileAction, {});
  const [dirty, setDirty] = useState(false);
  const tabs = useMemo(() => ["Basics", "Contact", "Branding", "Identity", "Markets", "AI Principles"], []);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  useEffect(() => {
    if (state.saved) setDirty(false);
  }, [state.saved]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty || !canEdit) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, canEdit]);

  return (
    <form action={action} className="company-profile-form" onChange={() => setDirty(true)}>
      <div className="profile-toolbar">
        <div>
          <strong>{profile.basic.displayName}</strong>
          <span>{canEdit ? "Editable master organization record" : "Read-only organization record"}</span>
        </div>
        {dirty && canEdit && <p className="unsaved-note">Unsaved changes</p>}
      </div>

      <div className="profile-tabs" role="tablist" aria-label="Company profile sections">
        {tabs.map(tab => (
          <button
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <section className={activeTab === "Basics" ? "profile-section active" : "profile-section"} aria-label="Basic information">
        <div className="settings-form profile-grid">
          <Field label="Company Name" name="companyName" defaultValue={profile.basic.companyName} readOnly={!canEdit} required />
          <Field label="Legal Name" name="legalName" defaultValue={profile.basic.legalName} readOnly={!canEdit} required />
          <Field label="Display Name" name="displayName" defaultValue={profile.basic.displayName} readOnly={!canEdit} required />
          <Field label="Tagline" name="tagline" defaultValue={profile.basic.tagline} readOnly={!canEdit} />
          <Field label="Industry" name="industry" defaultValue={profile.basic.industry} readOnly={!canEdit} />
          <Field label="Headquarters Country" name="headquartersCountry" defaultValue={profile.basic.headquartersCountry} readOnly={!canEdit} />
          <Field label="Headquarters City" name="headquartersCity" defaultValue={profile.basic.headquartersCity} readOnly={!canEdit} />
          <Field label="Time Zone" name="timeZone" defaultValue={profile.basic.timeZone} readOnly={!canEdit} required />
          <Field label="Default Currency" name="defaultCurrency" defaultValue={profile.basic.defaultCurrency} readOnly={!canEdit} required />
          <Field label="Default Language" name="defaultLanguage" defaultValue={profile.basic.defaultLanguage} readOnly={!canEdit} required />
          <Field label="Secondary Language" name="secondaryLanguage" defaultValue={profile.basic.secondaryLanguage} readOnly={!canEdit} />
          <Field label="Date Format" name="dateFormat" defaultValue={profile.basic.dateFormat} readOnly={!canEdit} />
          <Field label="Number Format" name="numberFormat" defaultValue={profile.basic.numberFormat} readOnly={!canEdit} />
        </div>
      </section>

      <section className={activeTab === "Contact" ? "profile-section active" : "profile-section"} aria-label="Contact information">
        <div className="settings-form profile-grid">
          <Field label="Website" name="website" defaultValue={profile.contact.website} readOnly={!canEdit} type="url" />
          <Field label="General Email" name="generalEmail" defaultValue={profile.contact.generalEmail} readOnly={!canEdit} type="email" />
          <Field label="Support Email" name="supportEmail" defaultValue={profile.contact.supportEmail} readOnly={!canEdit} type="email" />
          <Field label="Phone" name="phone" defaultValue={profile.contact.phone} readOnly={!canEdit} />
          <Field label="WhatsApp" name="whatsApp" defaultValue={profile.contact.whatsApp} readOnly={!canEdit} />
          <Field label="Google Maps Link" name="googleMapsLink" defaultValue={profile.contact.googleMapsLink} readOnly={!canEdit} type="url" />
          <TextArea label="Office Address" name="officeAddress" defaultValue={profile.contact.officeAddress} readOnly={!canEdit} rows={3} />
          <TextArea label="Business Hours" name="businessHours" defaultValue={profile.contact.businessHours} readOnly={!canEdit} rows={3} />
        </div>
      </section>

      <section className={activeTab === "Branding" ? "profile-section active" : "profile-section"} aria-label="Branding">
        <div className="upload-grid">
          {[
            ["Logo Upload", profile.branding.logoUploadPlaceholder],
            ["Dark Logo", profile.branding.darkLogoPlaceholder],
            ["Light Logo", profile.branding.lightLogoPlaceholder],
            ["Favicon", profile.branding.faviconPlaceholder],
          ].map(([label, description]) => (
            <div className="upload-placeholder" key={label}>
              <strong>{label}</strong>
              <p>{description}</p>
              <span>Upload integration placeholder</span>
            </div>
          ))}
        </div>
        <div className="settings-form profile-grid">
          <Field label="Primary Color" name="primaryColor" defaultValue={profile.branding.primaryColor} readOnly={!canEdit} type="color" />
          <Field label="Secondary Color" name="secondaryColor" defaultValue={profile.branding.secondaryColor} readOnly={!canEdit} type="color" />
          <Field label="Accent Color" name="accentColor" defaultValue={profile.branding.accentColor} readOnly={!canEdit} type="color" />
          <Field label="Background Color" name="backgroundColor" defaultValue={profile.branding.backgroundColor} readOnly={!canEdit} type="color" />
        </div>
      </section>

      <section className={activeTab === "Identity" ? "profile-section active" : "profile-section"} aria-label="Business identity">
        <div className="settings-form profile-grid">
          <TextArea label="About Morifar" name="about" defaultValue={profile.identity.about} readOnly={!canEdit} required rows={6} />
          <TextArea label="Internal Mission" name="internalMission" defaultValue={profile.identity.internalMission} readOnly={!canEdit} rows={4} />
          <TextArea label="Vision Statement" name="visionStatement" defaultValue={profile.identity.visionStatement} readOnly={!canEdit} rows={4} />
          <TextArea label="Customer Promise" name="customerPromise" defaultValue={profile.identity.customerPromise} readOnly={!canEdit} rows={5} />
          <TextArea label="Core Values" name="coreValues" defaultValue={profile.identity.coreValues} readOnly={!canEdit} rows={7} />
        </div>
      </section>

      <section className={activeTab === "Markets" ? "profile-section active" : "profile-section"} aria-label="Enabled countries and services">
        <div className="choice-columns">
          <fieldset>
            <legend>Enabled Countries</legend>
            {enabledCountryOptions.map(country => (
              <label key={country}>
                <input defaultChecked={profile.enabledCountries.includes(country)} disabled={!canEdit} name="enabledCountries" type="checkbox" value={country} />
                <span>{country}</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Core Services</legend>
            {coreServiceOptions.map(service => (
              <label key={service}>
                <input defaultChecked={profile.coreServices.includes(service)} disabled={!canEdit} name="coreServices" type="checkbox" value={service} />
                <span>{service}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </section>

      <section className={activeTab === "AI Principles" ? "profile-section active" : "profile-section"} aria-label="AI operating principles">
        <div className="settings-form profile-grid">
          {aiPrincipleKeys.map(key => (
            <TextArea
              defaultValue={profile.aiOperatingPrinciples[key]}
              key={key}
              label={principleLabels[key]}
              name={`ai_${key}`}
              readOnly={!canEdit}
              rows={3}
            />
          ))}
        </div>
      </section>

      {state.error && <p className="form-error">{state.error}</p>}
      {state.saved && <p className="form-success">Company Profile saved.</p>}
      <div className="form-actions">
        {!canEdit && <p className="readonly-note">Only Super Admin and CEO roles can edit this profile.</p>}
        <button className="gold-button" disabled={!canEdit || pending} type="submit">{pending ? "Saving..." : "Save Company Profile"}</button>
      </div>
    </form>
  );
}

