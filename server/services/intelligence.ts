import "server-only";
import {getDb} from "@/server/db";
import {getAiProvider} from "@/server/ai/provider";
import type {ClientHealthScore, ClientIntelligence, Insight, KnowledgeArticle, OperationsIntelligence, TaskRecommendation} from "@/features/intelligence/types";

type ClientRow = {id: string; name: string; email: string; country: string; visa_status: string | null; company_id: string | null; company_name: string | null; consultant_name: string | null; ai_name: string | null; status: string};
type CompanyRow = {id: string; name: string; country: string; industry: string | null; formation_status: string; renewal_date: string | null};

function scalar(sql: string, ...params: (string | number | null)[]) {
  return Number((getDb().prepare(sql).get(...params) as {value: number} | undefined)?.value ?? 0);
}

function priorityRank(priority: string) {
  return priority === "urgent" ? 4 : priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

function healthTone(score: number) {
  return score >= 78 ? "green" as const : score >= 55 ? "amber" as const : "red" as const;
}

function healthLabel(tone: "green" | "amber" | "red") {
  return tone === "green" ? "Green" : tone === "amber" ? "Amber" : "Red";
}

export function calculateClientHealth(clientId: string): ClientHealthScore {
  const missingDocs = scalar("SELECT COUNT(*) value FROM document_requests WHERE client_id=? AND status IN ('pending','rejected')", clientId);
  const overdueTasks = scalar("SELECT COUNT(*) value FROM tasks WHERE client_id=? AND status NOT IN ('done','cancelled') AND deadline<datetime('now')", clientId);
  const pendingApprovals = scalar("SELECT COUNT(*) value FROM approvals WHERE status='pending' AND entity_id IN (SELECT id FROM company_applications WHERE client_id=?)", clientId);
  const activeApplications = scalar("SELECT COUNT(*) value FROM company_applications WHERE client_id=? AND current_status!='completed'", clientId);
  const workflowProgress = scalar("SELECT COALESCE(MAX(progress),0) value FROM company_applications WHERE client_id=?", clientId);
  let score = 92;
  score -= missingDocs * 10;
  score -= overdueTasks * 14;
  score -= pendingApprovals * 9;
  score -= activeApplications > 0 ? Math.max(0, 25 - Math.round(workflowProgress / 4)) : 0;
  score = Math.max(0, Math.min(100, score));
  const tone = healthTone(score);
  const breakdown = [
    `${missingDocs} missing or rejected document request${missingDocs === 1 ? "" : "s"}`,
    `${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"}`,
    `${pendingApprovals} pending approval${pendingApprovals === 1 ? "" : "s"}`,
    activeApplications ? `Best formation progress is ${workflowProgress}%` : "No active formation workflow pressure",
  ];
  return {score, tone, label: healthLabel(tone), breakdown};
}

export function getClientIntelligence(): ClientIntelligence[] {
  const db = getDb();
  const clients = db.prepare(`
    SELECT c.*,co.name company_name,u.name consultant_name,ai.name ai_name
    FROM clients c
    LEFT JOIN companies co ON co.id=c.company_id
    LEFT JOIN users u ON u.id=c.consultant_id
    LEFT JOIN ai_professionals ai ON ai.id=c.ai_professional_id
    WHERE c.status='active'
    ORDER BY c.created_at DESC
  `).all() as ClientRow[];
  return clients.map(client => clientIntelligenceFor(client));
}

function clientIntelligenceFor(client: ClientRow): ClientIntelligence {
  const db = getDb();
  const app = db.prepare("SELECT current_status,progress,priority,notes FROM company_applications WHERE client_id=? ORDER BY updated_at DESC LIMIT 1").get(client.id) as {current_status: string; progress: number; priority: string; notes: string | null} | undefined;
  const missingDocuments = (db.prepare("SELECT document_type FROM document_requests WHERE client_id=? AND status IN ('pending','rejected') ORDER BY status DESC,document_type").all(client.id) as {document_type: string}[]).map(row => row.document_type);
  const outstandingApprovals = (db.prepare("SELECT title FROM approvals WHERE status='pending' AND (entity_id IN (SELECT id FROM company_applications WHERE client_id=?) OR entity_id IN (SELECT id FROM document_requests WHERE client_id=?)) ORDER BY priority").all(client.id, client.id) as {title: string}[]).map(row => row.title);
  const openTasks = (db.prepare("SELECT title FROM tasks WHERE client_id=? AND status NOT IN ('done','cancelled') ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,deadline LIMIT 5").all(client.id) as {title: string}[]).map(row => row.title);
  const activities = (db.prepare("SELECT action FROM activities WHERE entity_id IN (?,?) ORDER BY created_at DESC LIMIT 3").all(client.id, client.company_id ?? "") as {action: string}[]).map(row => row.action);
  const health = calculateClientHealth(client.id);
  const blockers = [
    ...missingDocuments.slice(0, 2).map(item => `Document blocked: ${item}`),
    ...outstandingApprovals.slice(0, 2).map(item => `Approval pending: ${item}`),
    ...openTasks.length > 3 ? ["Multiple open tasks need sequencing"] : [],
  ];
  const recommendations: Insight[] = [
    missingDocuments.length ? {title: "Resolve document gaps", detail: `Request or replace ${missingDocuments[0]} before the next workflow step.`, priority: "high"} : {title: "Keep document set current", detail: "No critical document gap is visible; monitor expiry and workflow-specific requirements.", priority: "low"},
    outstandingApprovals.length ? {title: "Clear approval queue", detail: outstandingApprovals[0], priority: "urgent"} : {title: "Maintain approval readiness", detail: "No blocking approval is currently visible.", priority: "low"},
    openTasks.length ? {title: "Sequence open work", detail: `${openTasks.length} open task(s) should be reviewed by owner and deadline.`, priority: "medium"} : {title: "No open task pressure", detail: "Client task queue is currently clear.", priority: "low"},
  ];
  const stage = app?.current_status?.replaceAll("_", " ") ?? client.visa_status?.replaceAll("_", " ") ?? "active client";
  return {
    clientId: client.id,
    clientName: client.name,
    companyName: client.company_name ?? "No company linked",
    workflowStage: stage,
    missingDocuments,
    outstandingApprovals,
    openTasks,
    blockers,
    recommendations,
    suggestedNextAction: blockers[0] ?? (app ? "Prepare the next workflow milestone." : "Confirm next commercial objective with the client."),
    health,
    briefing: {
      overview: `${client.name} is an active ${client.country} client linked to ${client.company_name ?? "no company record"}.`,
      currentProgress: app ? `Current workflow stage is ${stage} with ${app.progress}% progress.` : `No active formation workflow is linked.`,
      recentActivity: activities[0] ?? "No recent activity is recorded.",
      outstandingIssues: blockers.length ? blockers.join("; ") : "No critical blocker detected.",
      recommendedNextSteps: blockers[0] ?? "Continue monitoring open work and upcoming renewals.",
      aiObservations: `AI-generated: health is ${health.label} at ${health.score}/100 based on documents, tasks, approvals and workflow progress.`,
    },
  };
}

export function getCompanyBriefings() {
  const companies = getDb().prepare("SELECT id,name,country,industry,formation_status,renewal_date FROM companies ORDER BY renewal_date").all() as CompanyRow[];
  return companies.map(company => {
    const openTasks = scalar("SELECT COUNT(*) value FROM tasks WHERE company_id=? AND status NOT IN ('done','cancelled')", company.id);
    const openApplications = scalar("SELECT COUNT(*) value FROM company_applications WHERE company_id=? AND current_status!='completed'", company.id);
    const renewal = company.renewal_date ? new Date(company.renewal_date).toLocaleDateString("en-AE", {day: "numeric", month: "short", year: "numeric"}) : "Not set";
    return {
      id: company.id,
      name: company.name,
      summary: `AI-generated: ${company.name} is a ${company.country} ${company.industry ?? "business"} with ${company.formation_status.replaceAll("_", " ")} status.`,
      progress: openApplications ? `${openApplications} active company application(s)` : "No active formation application",
      issues: openTasks ? `${openTasks} open company task(s)` : "No open company tasks",
      nextSteps: `Review renewal date ${renewal} and confirm any outstanding compliance evidence.`,
    };
  });
}

export function getTaskRecommendation(): TaskRecommendation {
  const db = getDb();
  const departments = db.prepare(`
    SELECT d.id,d.name,COUNT(q.id) open_items,SUM(CASE q.priority WHEN 'urgent' THEN 1 ELSE 0 END) urgent_items
    FROM departments d LEFT JOIN department_queue_items q ON q.department_id=d.id AND q.status!='done'
    GROUP BY d.id,d.name ORDER BY open_items ASC,d.name LIMIT 1
  `).get() as {id: string; name: string; open_items: number; urgent_items: number};
  const consultant = db.prepare(`
    SELECT u.id,u.name,COUNT(t.id) open_tasks FROM users u
    LEFT JOIN tasks t ON t.assigned_user_id=u.id AND t.status NOT IN ('done','cancelled')
    WHERE u.status='active'
    GROUP BY u.id,u.name ORDER BY open_tasks ASC,u.name LIMIT 1
  `).get() as {id: string; name: string; open_tasks: number};
  const ai = db.prepare("SELECT id,name,current_workload,performance,status FROM ai_professionals WHERE is_paused=0 ORDER BY current_workload ASC,performance DESC LIMIT 1").get() as {id: string; name: string; current_workload: number; performance: number; status: string};
  const urgentQueues = scalar("SELECT COUNT(*) value FROM department_queue_items WHERE priority='urgent' AND status!='done'");
  return {
    departmentId: departments.id,
    departmentName: departments.name,
    consultantId: consultant.id,
    consultantName: consultant.name,
    aiId: ai.id,
    aiName: ai.name,
    priority: urgentQueues > 2 ? "high" : "medium",
    estimatedCompletion: urgentQueues > 2 ? "1 business day" : "2 business days",
    rationale: [
      `${departments.name} has the lowest visible queue load.`,
      `${consultant.name} has ${consultant.open_tasks} open task(s).`,
      `${ai.name} has workload ${ai.current_workload}/10 and ${ai.performance}% performance.`,
      "AI-generated recommendation only; assignment requires user confirmation.",
    ],
  };
}

export function getApprovalObservation(approvalId: string): Insight[] {
  const row = getDb().prepare("SELECT * FROM approvals WHERE id=?").get(approvalId) as {title: string; entity_type: string; entity_id: string; priority: string; reason: string | null} | undefined;
  if (!row) return [];
  const findings: Insight[] = [];
  if (row.priority === "urgent" || row.priority === "high") findings.push({title: "Priority review", detail: "AI-generated: this approval has elevated priority and should be checked before routine items.", priority: row.priority as "high" | "urgent"});
  if (row.entity_type === "document") findings.push({title: "Document consistency", detail: "AI-generated: confirm the replacement document is current, legible and attached to the correct client/company.", priority: "high"});
  if (row.entity_type === "company_application") findings.push({title: "Formation milestone", detail: "AI-generated: compare required documents, current status and audit history before approving.", priority: "high"});
  if (row.reason) findings.push({title: "Review reason", detail: `AI-generated: decision context says "${row.reason}".`, priority: "medium"});
  return findings.length ? findings : [{title: "Standard review", detail: "AI-generated: no unusual signal detected, but human approval remains mandatory.", priority: "low"}];
}

export function getOperationsIntelligence(): OperationsIntelligence {
  const db = getDb();
  const departmentWorkload = db.prepare(`
    SELECT d.name department,COUNT(q.id) openItems,SUM(CASE q.priority WHEN 'urgent' THEN 1 ELSE 0 END) urgentItems
    FROM departments d LEFT JOIN department_queue_items q ON q.department_id=d.id AND q.status!='done'
    GROUP BY d.id,d.name ORDER BY openItems DESC
  `).all() as {department: string; openItems: number; urgentItems: number}[];
  const delayedCases = (db.prepare(`
    SELECT title,priority,due_date FROM department_queue_items
    WHERE status!='done' AND due_date<datetime('now','+2 days')
    ORDER BY due_date LIMIT 5
  `).all() as {title: string; priority: string; due_date: string}[]).map(row => ({title: row.title, detail: `Due ${new Date(row.due_date).toLocaleDateString("en-AE", {day: "numeric", month: "short"})}`, priority: row.priority as Insight["priority"]}));
  const bottlenecks = departmentWorkload.filter(row => row.openItems > 0).slice(0, 4).map(row => ({title: row.department, detail: `${row.openItems} open queue item(s), ${row.urgentItems ?? 0} urgent.`, priority: row.urgentItems ? "high" as const : "medium" as const}));
  const healthDistribution = getClientIntelligence().reduce((items, client) => {
    const bucket = items.find(item => item.tone === client.health.tone);
    if (bucket) bucket.count += 1;
    return items;
  }, [{tone: "green" as const, count: 0}, {tone: "amber" as const, count: 0}, {tone: "red" as const, count: 0}]);
  const completed = db.prepare("SELECT elapsed_minutes FROM workflow_runs WHERE status='completed'").all() as {elapsed_minutes: number}[];
  const averageCompletionTime = completed.length ? Math.round(completed.reduce((sum, row) => sum + row.elapsed_minutes, 0) / completed.length) : 0;
  return {
    departmentWorkload,
    bottlenecks,
    delayedCases,
    pendingApprovals: scalar("SELECT COUNT(*) value FROM approvals WHERE status='pending'"),
    averageCompletionTime,
    aiProductivity: db.prepare("SELECT name,current_workload workload,performance,status FROM ai_professionals ORDER BY performance DESC LIMIT 6").all() as {name: string; workload: number; performance: number; status: string}[],
    humanWorkload: db.prepare("SELECT u.name,COUNT(t.id) openTasks FROM users u LEFT JOIN tasks t ON t.assigned_user_id=u.id AND t.status NOT IN ('done','cancelled') WHERE u.status='active' GROUP BY u.id,u.name ORDER BY openTasks DESC").all() as {name: string; openTasks: number}[],
    healthDistribution,
  };
}

export async function answerExecutiveQuestion(question: string) {
  const q = question.trim().toLowerCase();
  const clients = getClientIntelligence();
  const ops = getOperationsIntelligence();
  const provider = getAiProvider();
  await provider.complete([{role: "user", content: question || "highest priority work"}]);
  if (q.includes("urgent") || q.includes("attention")) {
    return {title: "Clients requiring urgent attention", answer: clients.filter(c => c.health.tone !== "green").map(c => `${c.clientName}: ${c.suggestedNextAction}`).join("\n") || "No urgent client health issue is visible."};
  }
  if (q.includes("formation") || q.includes("delayed")) return {title: "Delayed formation and workflow cases", answer: ops.delayedCases.map(item => `${item.title}: ${item.detail}`).join("\n") || "No delayed case detected."};
  if (q.includes("consultant") || q.includes("workload")) return {title: "Human workload", answer: ops.humanWorkload.map(item => `${item.name}: ${item.openTasks} open task(s)`).join("\n")};
  if (q.includes("department") || q.includes("backlog")) return {title: "Department backlog", answer: ops.departmentWorkload.map(item => `${item.department}: ${item.openItems} open, ${item.urgentItems ?? 0} urgent`).join("\n")};
  if (q.includes("approval")) return {title: "Pending approvals", answer: `${ops.pendingApprovals} approval(s) pending. Review Approvals for AI-generated observations before deciding.`};
  return {title: "Highest-priority work today", answer: [...ops.delayedCases, ...ops.bottlenecks].slice(0, 6).map(item => `${item.title}: ${item.detail}`).join("\n") || "No critical priority signal is visible."};
}

export function getKnowledgeArticles(): KnowledgeArticle[] {
  return [
    {id: "kb-sop-formation", title: "Company Formation SOP", category: "SOP", department: "Company Formation", summary: "Step-by-step formation intake, document review, approval and licence handoff procedure.", tags: ["formation", "licence", "documents"], updatedAt: "2026-06-29"},
    {id: "kb-visa-golden", title: "Golden Visa Procedure", category: "Visa Procedures", department: "Legal & Compliance", summary: "Eligibility review, document pack, approval checkpoints and escalation rules for Golden Visa cases.", tags: ["visa", "golden visa", "approval"], updatedAt: "2026-06-29"},
    {id: "kb-banking-corporate", title: "Corporate Banking Readiness", category: "Banking Procedures", department: "Finance", summary: "KYC, beneficial ownership, activity narrative and bank statement readiness checklist.", tags: ["banking", "kyc", "corporate"], updatedAt: "2026-06-29"},
    {id: "kb-compliance-docs", title: "Compliance Document Checklist", category: "Compliance Checklists", department: "Legal & Compliance", summary: "Document validity, consistency and human review requirements before approval.", tags: ["compliance", "documents", "approval"], updatedAt: "2026-06-29"},
    {id: "kb-policy-ai-review", title: "AI Recommendation Policy", category: "Internal Policies", department: "Executive Office", summary: "AI recommendations must be labelled, explainable and never used for irreversible decisions without human approval.", tags: ["ai", "policy", "human approval"], updatedAt: "2026-06-29"},
    {id: "kb-template-client-brief", title: "Client Briefing Template", category: "Templates", department: "Sales & Growth", summary: "Standard briefing structure for current progress, recent activity, blockers and next steps.", tags: ["template", "briefing", "client"], updatedAt: "2026-06-29"},
  ];
}
