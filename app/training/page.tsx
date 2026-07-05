import Link from "next/link";
import {IconArrowRight} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {requireSession} from "@/features/auth/session";

const modules = [
  ["How to use Dashboard", "/dashboard", ["Open Dashboard", "Review attention metrics", "Open tasks, approvals or leads that require action"]],
  ["How to add a Lead", "/leads/new", ["Open Create Lead", "Enter contact and service details", "Assign consultant or AI support"]],
  ["How to convert Lead to Client", "/crm", ["Qualify the lead", "Create or link company/client records", "Create follow-up tasks"]],
  ["How to create Task", "/tasks/new", ["Add title and deadline", "Choose priority", "Assign human and AI owner where relevant"]],
  ["How to manage Company Formation", "/company-formation", ["Open formation case", "Review milestone", "Update documents and approvals"]],
  ["How to use Documents", "/documents", ["Review requested documents", "Check status", "Follow up rejected or pending items"]],
  ["How to use Approvals", "/approvals", ["Review context", "Approve, reject or request more information", "Keep decision notes clear"]],
  ["How to read AI Recommendations", "/service-automation", ["Look for AI label", "Read why the recommendation exists", "Use human judgement before action"]],
  ["How to use Workflow Engine", "/workflow-engine", ["Review templates", "Monitor active runs", "Check audit log before changes"]],
  ["How to use Search and Notifications", "/search", ["Search by client, company or task", "Open notifications", "Clear work by priority"]],
] as const;

export default async function TrainingPage() {
  await requireSession();
  return (
    <div className="page">
      <PageHeader eyebrow="IMPLEMENTATION TRAINING" title="Training" subtitle="Short daily-use modules for Morifar OS users." />
      <div className="training-grid">
        {modules.map(([title, href, steps]) => (
          <article className="panel" key={title}>
            <h2>{title}</h2>
            <p>Use this module to learn the core workflow before handling live client work.</p>
            <ol className="ordered-playbook">{steps.map(step => <li key={step}>{step}</li>)}</ol>
            <Link className="gold-button" href={href}>Open page <IconArrowRight size={14} /></Link>
          </article>
        ))}
      </div>
    </div>
  );
}

