import Link from "next/link";
import {IconArrowRight, IconChecklist, IconRoute, IconShieldCheck} from "@tabler/icons-react";
import packageJson from "@/package.json";
import {PageHeader} from "@/components/page-header";
import {criticalRisks, rolloutOrder, systemRoutes} from "@/features/system-knowledge";
import {requireCtoSession} from "@/features/auth/session";

const quickLinks = [
  ["/system-status", "System Status"],
  ["/system-map", "System Map"],
  ["/cto-walkthrough", "CTO Walkthrough"],
  ["/admin/data-reset", "Data Reset"],
  ["/docs/USER_GUIDE.md", "User Guide"],
  ["/docs/FRESH_START_GUIDE.md", "Fresh Start Guide"],
] as const;

export default async function CtoStartPage() {
  const user = await requireCtoSession();
  const firstTen = systemRoutes.slice(0, 10);

  return (
    <div className="page cto-page">
      <PageHeader eyebrow="CTO ACCESS PACK" title="CTO Quick Start" subtitle="A practical landing page for understanding, auditing and guiding Morifar OS." />
      <section className="kpi-grid system-kpi-grid">
        <div className="kpi-card"><IconShieldCheck size={18} /><small>APP VERSION</small><strong>{packageJson.version}</strong><p>Version 1.0 Release Candidate</p></div>
        <div className="kpi-card"><IconChecklist size={18} /><small>READINESS</small><strong>95</strong><p>Internal RC score</p></div>
        <div className="kpi-card"><IconRoute size={18} /><small>ROUTES MAPPED</small><strong>{systemRoutes.length}</strong><p>Active route inventory</p></div>
        <div className="kpi-card"><small>ACCESS</small><strong>{user.role}</strong><p>Current CTO session role</p></div>
      </section>
      <section className="section-grid">
        <article className="panel">
          <div className="panel-head"><div><h2>First 10 Things To Inspect</h2><p>Recommended audit order for the acting CTO.</p></div></div>
          <div className="cto-list">{firstTen.map(item => <Link key={item.route} href={item.route}><strong>{item.pageName}</strong><span>{item.purpose}</span><IconArrowRight size={14} /></Link>)}</div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><h2>Critical Risks</h2><p>Known limits before full production-of-record usage.</p></div></div>
          <div className="risk-list">{criticalRisks.map(risk => <div key={risk}><IconShieldCheck size={15} /><p>{risk}</p></div>)}</div>
        </article>
      </section>
      <section className="section-grid">
        <article className="panel">
          <div className="panel-head"><div><h2>Operational Rollout Order</h2><p>Use this sequence before the first real client.</p></div></div>
          <ol className="ordered-playbook">{rolloutOrder.map(step => <li key={step}>{step}</li>)}</ol>
        </article>
        <article className="panel">
          <div className="panel-head"><div><h2>CTO Links</h2><p>Fast access to handover materials.</p></div></div>
          <div className="quick-grid">{quickLinks.map(([href, label]) => <Link key={href} href={href}><IconArrowRight size={14} />{label}</Link>)}</div>
        </article>
      </section>
    </div>
  );
}

