import {PageHeader} from "@/components/page-header";
import {BriefingPanel, IntelligenceLinkBar} from "@/components/intelligence-panels";
import {getClientIntelligence, getCompanyBriefings} from "@/server/services/intelligence";

export const dynamic = "force-dynamic";

export default function ClientIntelligencePage() {
  const clients = getClientIntelligence();
  const companies = getCompanyBriefings();
  return (
    <div className="page">
      <PageHeader eyebrow="CLIENT INTELLIGENCE" title="AI Briefing Panels" subtitle="Client and company summaries, health scores, blockers and recommended next steps." />
      <IntelligenceLinkBar />
      <section className="briefing-grid">{clients.map(client => <BriefingPanel client={client} key={client.clientId} />)}</section>
      <section className="panel intelligence-panel recent">
        <div className="panel-head"><div><h2>Company briefings</h2><p>Automatically generated company summaries for staff context.</p></div></div>
        <div className="settings-rows">{companies.map(company => <div key={company.id}><div><strong>{company.name}</strong><p>{company.summary}</p><p>{company.progress} · {company.issues}</p></div><span>{company.nextSteps}</span></div>)}</div>
      </section>
    </div>
  );
}
