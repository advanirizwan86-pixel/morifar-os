import Link from "next/link";
import {IconAlertTriangle, IconArrowUpRight, IconChecklist, IconFileDescription, IconMessageCircle, IconRobot, IconShieldCheck, IconTimelineEvent} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {getServiceAutomationDashboard} from "@/server/services/service-automation";

export const dynamic = "force-dynamic";

export default function ServiceAutomationPage() {
  const data = getServiceAutomationDashboard();
  const metrics = [
    ["REVENUE PIPELINE", data.executiveMetrics.revenuePipeline],
    ["FORMATION PIPELINE", data.executiveMetrics.formationPipeline],
    ["CASES DELAYED", data.executiveMetrics.casesDelayed],
    ["CASES AT RISK", data.executiveMetrics.casesAtRisk],
    ["PENDING APPROVALS", data.executiveMetrics.pendingApprovals],
    ["AI PRODUCTIVITY", data.executiveMetrics.dailyAiProductivity.value],
  ];
  return <div className="page service-automation-page">
    <PageHeader eyebrow="PHASE 6 SERVICE AUTOMATION" title="Service Automation" subtitle="AI prepares, recommends, drafts, validates and tracks work. Humans approve every sensitive action." action={<Link className="gold-button" href="/company-formation"><IconArrowUpRight size={17}/>Open formation</Link>}/>
    <section className="kpi-grid">{metrics.map(([label,value])=><div className="kpi-card" key={String(label)}><small>{label}</small><strong>{value}</strong><p>Executive operations signal</p></div>)}</section>
    <section className="section-grid">
      <article className="panel"><div className="panel-head"><div><h2>Company formation workspace</h2><p>Mainland, Free Zone and Offshore applications with AI next-step suggestions.</p></div><IconRobot size={18}/></div><div className="service-card-list">{data.workspaces.map(item=><div key={item.application.id} className="service-card"><div><strong>{item.application.company_name}</strong><span className={`priority ${item.riskLevel}`}>{item.riskLevel}</span></div><p>{item.currentStatus} - {item.timeline}</p><dl><div><dt>Next step</dt><dd>{item.nextStep}</dd></div><div><dt>Missing docs</dt><dd>{item.missingDocuments.join(", ") || "None visible"}</dd></div><div><dt>Government actions</dt><dd>{item.requiredGovernmentActions.join(", ") || "No immediate action"}</dd></div><div><dt>Client actions</dt><dd>{item.requiredClientActions.join(", ")}</dd></div><div><dt>Owner</dt><dd>{item.application.consultant_name ?? "Unassigned"} / {item.application.ai_name ?? "No AI"}</dd></div><div><dt>ETA</dt><dd>{item.estimatedCompletion}</dd></div></dl>{item.recommendations.map(rec=><div className="ai-explain" key={rec.title}><IconRobot size={14}/><div><strong>{rec.title}</strong><p>{rec.why}</p><em>{rec.action} Human approval required.</em></div></div>)}</div>)}</div></article>
      <article className="panel"><div className="panel-head"><div><h2>Smart case manager</h2><p>Case health, risk, owner, timeline and next action.</p></div><IconAlertTriangle size={18}/></div><div className="case-list">{data.cases.map(item=><div key={item.company}><div><strong>{item.company}</strong><span>{item.caseHealth}/100 health</span></div><p>{item.aiSummary}</p><small>Next: {item.recommendedNextAction}</small><small>Owner: {item.currentOwner} - ETA {item.estimatedCompletion}</small></div>)}</div></article>
    </section>
    <section className="section-grid">
      <article className="panel"><div className="panel-head"><div><h2>Document validation</h2><p>AI-assisted review flags issues but never rejects automatically.</p></div><IconShieldCheck size={18}/></div><div className="validation-grid">{data.documentFindings.slice(0,9).map(item=><div key={`${item.documentType}-${item.issue}`}><span className={`badge ${item.status}`}>{item.status.replaceAll("_"," ")}</span><strong>{item.documentType}</strong><p>{item.issue}</p><small>{item.why}</small><em>{item.recommendedAction}</em></div>)}</div></article>
      <article className="panel"><div className="panel-head"><div><h2>AI compliance checklist</h2><p>Pending, completed, blocked and requires-review controls.</p></div><IconChecklist size={18}/></div><div className="compliance-list">{data.complianceItems.map(item=><div key={item.label}><span className={`badge ${item.status}`}>{item.status.replaceAll("_"," ")}</span><div><strong>{item.label}</strong><p>{item.why}</p></div></div>)}</div></article>
    </section>
    <section className="section-grid">
      <article className="panel"><div className="panel-head"><div><h2>Document generator</h2><p>Reusable templates merged from client/company data. Drafts require human finalization.</p></div><IconFileDescription size={18}/></div><div className="draft-grid">{data.generatedDrafts.map(draft=><div key={draft.type}><strong>{draft.title}</strong><p>{draft.body.split("\n").slice(1,4).join(" - ")}</p><small>Merge fields: {draft.mergeFields.join(", ")}</small><em>Human review required before finalization.</em></div>)}</div></article>
      <article className="panel"><div className="panel-head"><div><h2>Client communication assistant</h2><p>Email, WhatsApp, reminder and status drafts require approval before sending.</p></div><IconMessageCircle size={18}/></div><div className="draft-grid">{data.communicationDrafts.map(draft=><div key={draft.channel}><strong>{draft.channel}: {draft.subject}</strong><p>{draft.body}</p><small>Why: {draft.why}</small><em>User approval required before sending.</em></div>)}</div></article>
    </section>
    <section className="section-grid">
      <article className="panel"><div className="panel-head"><div><h2>Enhanced activity timeline</h2><p>AI recommendations, human decisions, documents, approvals, tasks, workflow transitions and system events.</p></div><IconTimelineEvent size={18}/></div><div className="timeline-mini">{data.timeline.slice(0,8).map(item=><div key={`${item.source}-${item.id}`}><span>{item.eventType}</span><strong>{item.actor}</strong><p>{item.action.replaceAll("_"," ")} - {item.entity_type}</p><time>{new Date(item.created_at).toLocaleString("en-AE",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})}</time></div>)}</div></article>
      <article className="panel"><div className="panel-head"><div><h2>Configurable rules</h2><p>Recommendation rules are isolated for future country, service and regulation packs.</p></div><IconChecklist size={18}/></div><div className="compliance-list">{data.rules.map(rule=><div key={rule.id}><span className="badge completed">{rule.appliesTo}</span><div><strong>{rule.label}</strong><p>{rule.id}</p></div></div>)}</div></article>
    </section>
  </div>
}
