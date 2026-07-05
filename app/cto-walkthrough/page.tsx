import {PageHeader} from "@/components/page-header";
import {dailyFlow, criticalRisks, featureInventory} from "@/features/system-knowledge";
import {requireCtoSession} from "@/features/auth/session";

const sections = [
  ["What Morifar OS is", "Morifar OS is an internal operating platform for managing clients, leads, tasks, company formation work, documents, approvals, AI assistance, workflows and executive intelligence."],
  ["Current version", "The current build is Version 1.0.0 Release Candidate with Phase 6 service automation complete and Company Profile added for operational rollout."],
  ["Current modules", featureInventory.join(", ")],
  ["Main navigation map", "Dashboard, Operations, CRM, AI Workforce, Automation, Intelligence, Administration and Training form the core navigation groups."],
  ["Recommended daily-use flow", dailyFlow.join(" ")],
  ["How a lead becomes a client", "Create a lead, qualify it, assign a human consultant and AI professional, then create related client/company records and tasks once the opportunity is real."],
  ["How a company formation case works", "Formation cases track jurisdiction, business activity, shareholders, required documents, status milestones, approvals and department queue items."],
  ["How tasks work", "Tasks are operational units assigned to humans and/or AI professionals with priority, progress, review status, deadlines and linked clients or companies."],
  ["How documents work", "Documents and document requests track what has been requested, approved, rejected or still pending. Storage upload is not yet a production file store."],
  ["How AI recommendations work", "AI recommendations are labelled, explain why they exist and must support human decision-making. They do not approve or submit sensitive actions automatically."],
  ["How approvals work", "Approvals preserve human accountability for sensitive actions, rejected documents, workflow milestones and AI-assisted recommendations."],
  ["How workflow engine works", "The workflow engine stores templates, workflow definitions, run instances and audit logs. It is ready for orchestration design and internal monitoring."],
  ["How system status works", "System Status shows app version, release phase, build identity, database mode, route health, known risks and the last QA score."],
  ["Known risks", criticalRisks.join(" ")],
  ["What should be used first in real operations", "Start with Company Profile, data reset, first real lead, task creation, document requests, approvals and dashboard review."],
];

export default async function CtoWalkthroughPage() {
  await requireCtoSession();
  return (
    <div className="page cto-page">
      <PageHeader eyebrow="SYSTEM WALKTHROUGH" title="CTO Walkthrough" subtitle="Plain-English operating guide for Morifar OS." />
      <div className="walkthrough-grid">
        {sections.map(([title, body], index) => (
          <article className="panel" key={title}>
            <small>{String(index + 1).padStart(2, "0")}</small>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
