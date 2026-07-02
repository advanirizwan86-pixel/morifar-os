import Link from "next/link";
import {IconAlertTriangle, IconBrain, IconBulb, IconChartBar, IconChecks, IconFileText, IconShieldCheck} from "@tabler/icons-react";
import type {ClientIntelligence, Insight, KnowledgeArticle, OperationsIntelligence, TaskRecommendation} from "@/features/intelligence/types";

export function AiDisclosure() {
  return <p className="ai-disclosure">AI-generated recommendations. Human review remains required for approvals and irreversible decisions.</p>;
}

export function HealthBadge({tone, score, label}: {tone: "green" | "amber" | "red"; score: number; label: string}) {
  return <span className={`health-badge ${tone}`}>{label} · {score}</span>;
}

export function ClientInsightPanel({client}: {client: ClientIntelligence}) {
  return (
    <div className="ai-insights-panel">
      <div className="ai-panel-title"><IconBrain size={15} /><strong>AI Insights</strong><HealthBadge {...client.health} /></div>
      <p>{client.briefing.aiObservations}</p>
      <ul>{client.recommendations.slice(0, 2).map(item => <li key={item.title}><b>{item.title}</b><span>{item.detail}</span></li>)}</ul>
      <div className="next-action"><IconBulb size={14} />{client.suggestedNextAction}</div>
    </div>
  );
}

export function BriefingPanel({client}: {client: ClientIntelligence}) {
  return (
    <article className="briefing-card">
      <header><div><p className="eyebrow">AI BRIEFING</p><h2>{client.clientName}</h2><span>{client.companyName}</span></div><HealthBadge {...client.health} /></header>
      <dl>
        <div><dt>WORKFLOW STAGE</dt><dd>{client.workflowStage}</dd></div>
        <div><dt>MISSING DOCUMENTS</dt><dd>{client.missingDocuments.length || "None"}</dd></div>
        <div><dt>APPROVALS</dt><dd>{client.outstandingApprovals.length || "None"}</dd></div>
        <div><dt>OPEN TASKS</dt><dd>{client.openTasks.length || "None"}</dd></div>
      </dl>
      <section>
        <strong>Summary</strong>
        <p>{client.briefing.overview}</p>
        <p>{client.briefing.currentProgress}</p>
      </section>
      <section>
        <strong>Outstanding issues</strong>
        <p>{client.briefing.outstandingIssues}</p>
      </section>
      <section>
        <strong>Recommended next step</strong>
        <p>{client.briefing.recommendedNextSteps}</p>
      </section>
    </article>
  );
}

export function TaskRecommendationPanel({recommendation}: {recommendation: TaskRecommendation}) {
  return (
    <aside className="recommendation-panel panel">
      <div className="panel-head"><div><h2><IconBrain size={16} />Smart task recommendation</h2><p>Suggested ownership based on current workload</p></div></div>
      <AiDisclosure />
      <div className="recommendation-grid">
        <div><small>DEPARTMENT</small><strong>{recommendation.departmentName}</strong></div>
        <div><small>CONSULTANT</small><strong>{recommendation.consultantName}</strong></div>
        <div><small>AI PROFESSIONAL</small><strong>{recommendation.aiName}</strong></div>
        <div><small>PRIORITY</small><strong>{recommendation.priority}</strong></div>
        <div><small>ESTIMATE</small><strong>{recommendation.estimatedCompletion}</strong></div>
      </div>
      <ul>{recommendation.rationale.map(item => <li key={item}>{item}</li>)}</ul>
    </aside>
  );
}

export function ApprovalAssistant({observations}: {observations: Insight[]}) {
  return (
    <div className="approval-assistant">
      <div><IconShieldCheck size={15} /><strong>AI approval assistant</strong></div>
      {observations.map(item => <p key={item.title}><b>{item.title}:</b> {item.detail}</p>)}
    </div>
  );
}

export function OperationsDashboard({data}: {data: OperationsIntelligence}) {
  return (
    <>
      <section className="intelligence-kpis">
        <article><IconShieldCheck /><small>PENDING APPROVALS</small><strong>{data.pendingApprovals}</strong></article>
        <article><IconChartBar /><small>AVG COMPLETION</small><strong>{data.averageCompletionTime || "N/A"} min</strong></article>
        <article><IconAlertTriangle /><small>BOTTLENECKS</small><strong>{data.bottlenecks.length}</strong></article>
        <article><IconChecks /><small>DELAYED CASES</small><strong>{data.delayedCases.length}</strong></article>
      </section>
      <section className="intelligence-grid">
        <PanelList title="Workflow bottlenecks" items={data.bottlenecks} />
        <PanelList title="Delayed cases" items={data.delayedCases} />
        <article className="panel intelligence-panel"><h2>Department workload</h2>{data.departmentWorkload.map(item => <div className="bar-row" key={item.department}><span>{item.department}</span><i><b style={{width: `${Math.min(100, item.openItems * 18)}%`}} /></i><em>{item.openItems}</em></div>)}</article>
        <article className="panel intelligence-panel"><h2>Client health distribution</h2>{data.healthDistribution.map(item => <div className="health-row" key={item.tone}><HealthBadge tone={item.tone} label={item.tone.toUpperCase()} score={item.count} /><span>{item.count} client(s)</span></div>)}</article>
        <article className="panel intelligence-panel"><h2>AI productivity</h2>{data.aiProductivity.map(item => <div className="mini-row" key={item.name}><strong>{item.name}</strong><span>{item.performance}% · workload {item.workload}/10 · {item.status}</span></div>)}</article>
        <article className="panel intelligence-panel"><h2>Human workload</h2>{data.humanWorkload.map(item => <div className="mini-row" key={item.name}><strong>{item.name}</strong><span>{item.openTasks} open task(s)</span></div>)}</article>
      </section>
    </>
  );
}

function PanelList({title, items}: {title: string; items: Insight[]}) {
  return <article className="panel intelligence-panel"><h2>{title}</h2>{items.length ? items.map(item => <div className="insight-row" key={item.title}><span className={`priority ${item.priority}`}>{item.priority}</span><strong>{item.title}</strong><p>{item.detail}</p></div>) : <p className="muted-copy">No critical signal detected.</p>}</article>;
}

export function KnowledgeGrid({articles}: {articles: KnowledgeArticle[]}) {
  return (
    <section className="knowledge-grid">
      {articles.map(article => (
        <article className="knowledge-card" key={article.id}>
          <IconFileText size={20} />
          <span>{article.category}</span>
          <h2>{article.title}</h2>
          <p>{article.summary}</p>
          <div>{article.tags.map(tag => <em key={tag}>{tag}</em>)}</div>
          <small>{article.department} · Updated {new Date(article.updatedAt).toLocaleDateString("en-AE", {day: "numeric", month: "short", year: "numeric"})}</small>
        </article>
      ))}
    </section>
  );
}

export function IntelligenceLinkBar() {
  return (
    <nav className="intelligence-link-bar">
      <Link href="/executive-copilot">Executive Copilot</Link>
      <Link href="/client-intelligence">Client Intelligence</Link>
      <Link href="/operations-intelligence">Operations Intelligence</Link>
      <Link href="/knowledge-base">Knowledge Base</Link>
    </nav>
  );
}
