import Link from "next/link";
import {IconBuilding, IconGlobe, IconLock, IconRobot, IconUsers} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {getDb} from "@/server/db";
import {SettingsForm} from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const db = getDb();
  const company = JSON.parse((db.prepare("SELECT value FROM settings WHERE key='company'").get() as {value: string}).value) as {
    name: string;
    timezone: string;
    currency: string;
    language: string;
  };
  const departments = db
    .prepare("SELECT d.*,(SELECT COUNT(*) FROM users u WHERE u.department_id=d.id) users,(SELECT COUNT(*) FROM ai_professionals a WHERE a.department_id=d.id) ai FROM departments d ORDER BY name")
    .all() as {id: string; name: string; description: string; users: number; ai: number}[];
  const roles = db.prepare("SELECT name,permissions FROM roles ORDER BY name").all() as {name: string; permissions: string}[];
  const countries = db.prepare("SELECT * FROM countries WHERE active=1 ORDER BY name").all() as {code: string; name: string; currency: string; language: string}[];

  return (
    <div className="page">
      <PageHeader eyebrow="SYSTEM ADMINISTRATION" title="Settings" subtitle="Company configuration, access control and operating standards." />
      <div className="settings-layout">
        <nav aria-label="Settings sections">
          <a href="#company"><IconBuilding size={16} />Company</a>
          <Link href="/settings/company-profile"><IconBuilding size={16} />Company Profile</Link>
          <a href="#departments"><IconUsers size={16} />Departments</a>
          <a href="#roles"><IconLock size={16} />Roles & permissions</a>
          <a href="#countries"><IconGlobe size={16} />Markets</a>
          <a href="/ai-professionals"><IconRobot size={16} />AI configuration</a>
        </nav>
        <div>
          <section className="settings-section settings-card-section" id="company-profile">
            <div>
              <h2>Company Profile</h2>
              <p>Master organization record used by branding, workflows, AI guidance, reports and future templates.</p>
            </div>
            <Link className="settings-feature-card" href="/settings/company-profile">
              <IconBuilding size={22} />
              <div>
                <strong>Open Company Profile</strong>
                <p>Manage Morifar's legal identity, markets, services, brand values and AI operating principles.</p>
              </div>
              <span>Configure</span>
            </Link>
          </section>

          <section className="settings-section" id="company">
            <div>
              <h2>Company settings</h2>
              <p>Core organisation and localisation defaults.</p>
            </div>
            <SettingsForm initial={company} />
          </section>

          <section className="settings-section" id="departments">
            <div>
              <h2>Departments</h2>
              <p>Operational structure shared by humans and AI.</p>
            </div>
            <div className="settings-rows">
              {departments.map(department => (
                <div key={department.id}>
                  <div>
                    <strong>{department.name}</strong>
                    <p>{department.description}</p>
                  </div>
                  <span>{department.users} users · {department.ai} AI</span>
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section" id="roles">
            <div>
              <h2>Roles & permissions</h2>
              <p>Role-based access policy for Morifar OS.</p>
            </div>
            <div className="settings-rows">
              {roles.map(role => (
                <div key={role.name}>
                  <strong>{role.name}</strong>
                  <span>{JSON.parse(role.permissions).includes("*") ? "Full system access" : "Scoped operational access"}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section" id="countries">
            <div>
              <h2>Countries & currencies</h2>
              <p>Active service markets and localisation.</p>
            </div>
            <div className="settings-rows">
              {countries.map(country => (
                <div key={country.code}>
                  <strong>{country.name}</strong>
                  <span>{country.currency} · {country.language}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
