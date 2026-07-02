import Link from "next/link";
import {IconArrowLeft, IconBuildingSkyscraper, IconShieldCheck} from "@tabler/icons-react";
import {CompanyProfileForm} from "@/components/company-profile-form";
import {PageHeader} from "@/components/page-header";
import {requireExecutiveSession} from "@/features/auth/session";
import {getCompanyProfile} from "@/server/repositories/company-profile";

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage() {
  const user = await requireExecutiveSession();
  const profile = getCompanyProfile();
  const canEdit = ["Super Admin", "CEO"].includes(user.role);

  return (
    <div className="page company-profile-page">
      <Link className="back-link" href="/settings"><IconArrowLeft size={14} /> Back to Settings</Link>
      <PageHeader
        eyebrow="ORGANIZATION SETTINGS"
        title="Company Profile"
        subtitle="Master organization record for Morifar OS operations, AI guidance, branding and future templates."
      />
      <section className="profile-summary">
        <div>
          <IconBuildingSkyscraper size={20} />
          <small>DISPLAY NAME</small>
          <strong>{profile.basic.displayName}</strong>
          <p>{profile.basic.tagline}</p>
        </div>
        <div>
          <IconShieldCheck size={20} />
          <small>EDIT ACCESS</small>
          <strong>{canEdit ? "Enabled" : "Read-only"}</strong>
          <p>{canEdit ? `${user.role} can update this profile.` : "Only Super Admin and CEO roles can edit."}</p>
        </div>
        <div>
          <small>HEADQUARTERS</small>
          <strong>{profile.basic.headquartersCity}</strong>
          <p>{profile.basic.headquartersCountry} · {profile.basic.timeZone}</p>
        </div>
      </section>
      <CompanyProfileForm canEdit={canEdit} profile={profile} />
    </div>
  );
}

