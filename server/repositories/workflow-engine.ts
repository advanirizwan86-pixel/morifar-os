import "server-only";
import {getDb} from "@/server/db";
import type {
  WorkflowAuditLog,
  WorkflowDefinition,
  WorkflowEngineData,
  WorkflowPriority,
  WorkflowRun,
  WorkflowStatus,
  WorkflowSummary,
} from "@/features/workflow-engine/types";

type WorkflowRow = {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  department: string | null;
  country: string | null;
  priority: WorkflowPriority;
  status: WorkflowStatus;
  definition: string;
  updated_at: string;
};

type RunRow = {
  id: string;
  workflow_id: string;
  workflow_name: string;
  client: string | null;
  company: string | null;
  status: string;
  current_step_id: string | null;
  completed_steps: number;
  remaining_steps: number;
  elapsed_minutes: number;
  errors: string;
  ai_actions: string;
  human_actions: string;
  definition: string;
  updated_at: string;
};

type AuditRow = {
  id: string;
  created_at: string;
  user_name: string | null;
  ai_name: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
};

function readJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readDefinition(value: string): WorkflowDefinition {
  return readJson<WorkflowDefinition>(value, {nodes: [], edges: []});
}

function summarize(row: WorkflowRow): WorkflowSummary {
  const definition = readDefinition(row.definition);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    departmentId: row.department_id ?? "",
    department: row.department ?? "Unassigned",
    country: row.country ?? "Global",
    priority: row.priority,
    status: row.status,
    nodes: definition.nodes.length,
    updatedAt: row.updated_at,
  };
}

function runRisk(status: string, elapsed: number, errors: string[]) {
  if (status === "failed" || errors.length) return "High" as const;
  if (elapsed > 180) return "Medium" as const;
  return "Low" as const;
}

function currentNode(definition: WorkflowDefinition, currentStepId: string | null) {
  return definition.nodes.find(node => node.id === currentStepId) ?? definition.nodes[0];
}

export function getWorkflowEngineData(filters: {
  q?: string;
  status?: string;
  department?: string;
  country?: string;
  priority?: string;
  ai?: string;
  human?: string;
  date?: string;
  workflowId?: string;
} = {}): WorkflowEngineData {
  const db = getDb();
  const rows = db.prepare(`
    SELECT w.*,d.name department FROM workflows w
    LEFT JOIN departments d ON d.id=w.department_id
    ORDER BY CASE w.status WHEN 'running' THEN 0 WHEN 'active' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END,w.updated_at DESC
  `).all() as WorkflowRow[];

  let workflows = rows.map(summarize);
  const query = (filters.q ?? "").trim().toLowerCase();
  if (query) workflows = workflows.filter(item => `${item.name} ${item.description} ${item.department} ${item.country} ${item.status}`.toLowerCase().includes(query));
  if (filters.status && filters.status !== "all") workflows = workflows.filter(item => item.status === filters.status);
  if (filters.department && filters.department !== "all") workflows = workflows.filter(item => item.department === filters.department);
  if (filters.country && filters.country !== "all") workflows = workflows.filter(item => item.country === filters.country);
  if (filters.priority && filters.priority !== "all") workflows = workflows.filter(item => item.priority === filters.priority);
  if (filters.date) workflows = workflows.filter(item => item.updatedAt.slice(0, 10) === filters.date);
  if (filters.ai && filters.ai !== "all") workflows = workflows.filter(item => {
    const row = rows.find(candidate => candidate.id === item.id);
    return row ? readDefinition(row.definition).nodes.some(node => node.assignedAi === filters.ai) : false;
  });
  if (filters.human && filters.human !== "all") workflows = workflows.filter(item => {
    const row = rows.find(candidate => candidate.id === item.id);
    return row ? readDefinition(row.definition).nodes.some(node => node.assignedHuman === filters.human) : false;
  });

  const selectedRow = filters.workflowId
    ? rows.find(row => row.id === filters.workflowId)
    : rows.find(row => row.id === workflows[0]?.id);
  const selectedWorkflow = selectedRow ? summarize(selectedRow) : null;
  const selectedDefinition = selectedRow ? readDefinition(selectedRow.definition) : {nodes: [], edges: []};

  const runRows = db.prepare(`
    SELECT r.*,w.name workflow_name,w.definition,c.name client,co.name company
    FROM workflow_runs r
    JOIN workflows w ON w.id=r.workflow_id
    LEFT JOIN clients c ON c.id=r.client_id
    LEFT JOIN companies co ON co.id=r.company_id
    ORDER BY CASE r.status WHEN 'running' THEN 0 WHEN 'paused' THEN 1 WHEN 'failed' THEN 2 ELSE 3 END,r.updated_at DESC
    LIMIT 20
  `).all() as RunRow[];

  const visibleRunRows = filters.date ? runRows.filter(row => row.updated_at.slice(0, 10) === filters.date) : runRows;
  let runs: WorkflowRun[] = visibleRunRows.map(row => {
    const definition = readDefinition(row.definition);
    const node = currentNode(definition, row.current_step_id);
    const total = row.completed_steps + row.remaining_steps;
    const errors = readJson<string[]>(row.errors, []);
    return {
      id: row.id,
      workflowId: row.workflow_id,
      workflowName: row.workflow_name,
      client: row.client ?? "Internal",
      company: row.company ?? "Morifar",
      currentStep: node?.name ?? "Not started",
      currentStepType: node?.type ?? null,
      assignedAi: node?.assignedAi || "Unassigned",
      assignedHuman: node?.assignedHuman || "Unassigned",
      progress: total ? Math.round((row.completed_steps / total) * 100) : 0,
      elapsedMinutes: row.elapsed_minutes,
      riskLevel: runRisk(row.status, row.elapsed_minutes, errors),
      status: row.status,
      aiActions: readJson<string[]>(row.ai_actions, []),
      humanActions: readJson<string[]>(row.human_actions, []),
      errors,
    };
  });
  if (query) runs = runs.filter(run => `${run.workflowName} ${run.client} ${run.company} ${run.currentStep} ${run.assignedAi} ${run.assignedHuman}`.toLowerCase().includes(query));
  if (filters.ai && filters.ai !== "all") runs = runs.filter(run => run.assignedAi === filters.ai);
  if (filters.human && filters.human !== "all") runs = runs.filter(run => run.assignedHuman === filters.human);

  const auditLogs = (db.prepare(`
    SELECT l.*,u.name user_name,a.name ai_name FROM workflow_audit_logs l
    LEFT JOIN users u ON u.id=l.user_id
    LEFT JOIN ai_professionals a ON a.id=l.ai_professional_id
    ORDER BY l.created_at DESC LIMIT 30
  `).all() as AuditRow[]).map((row): WorkflowAuditLog => ({
    id: row.id,
    timestamp: row.created_at,
    user: row.user_name ?? "System",
    ai: row.ai_name ?? "None",
    action: row.action,
    oldValue: row.old_value ?? "",
    newValue: row.new_value ?? "",
    notes: row.notes ?? "",
  }));

  const completedRows = db.prepare(`
    SELECT CAST((julianday(completed_at)-julianday(started_at))*24*60 AS INTEGER) minutes
    FROM workflow_runs WHERE completed_at IS NOT NULL AND date(completed_at)=date('now')
  `).all() as {minutes: number}[];
  const avg = completedRows.length ? Math.round(completedRows.reduce((sum, row) => sum + row.minutes, 0) / completedRows.length) : 0;

  return {
    filters,
    metrics: {
      totalWorkflows: Number((db.prepare("SELECT COUNT(*) value FROM workflows").get() as {value: number}).value),
      runningWorkflows: Number((db.prepare("SELECT COUNT(*) value FROM workflow_runs WHERE status='running'").get() as {value: number}).value),
      pausedWorkflows: Number((db.prepare("SELECT COUNT(*) value FROM workflow_runs WHERE status='paused'").get() as {value: number}).value),
      completedToday: Number((db.prepare("SELECT COUNT(*) value FROM workflow_runs WHERE status='completed' AND date(completed_at)=date('now')").get() as {value: number}).value),
      failedWorkflows: Number((db.prepare("SELECT COUNT(*) value FROM workflow_runs WHERE status='failed'").get() as {value: number}).value),
      averageCompletionTime: avg,
      aiTasksRunning: Number((db.prepare("SELECT COUNT(*) value FROM tasks WHERE assigned_ai_id IS NOT NULL AND status='in_progress'").get() as {value: number}).value),
      humanTasksPending: Number((db.prepare("SELECT COUNT(*) value FROM tasks WHERE assigned_user_id IS NOT NULL AND status IN ('todo','review')").get() as {value: number}).value),
    },
    workflows,
    selectedWorkflow,
    selectedDefinition,
    runs,
    auditLogs,
    departments: (db.prepare("SELECT id,name FROM departments ORDER BY name").all() as {id: string; name: string}[]).map(item => ({id: item.id, name: item.name})),
    countries: Array.from(new Set(rows.map(row => row.country ?? "Global"))).sort(),
    aiProfessionals: (db.prepare("SELECT id,name FROM ai_professionals ORDER BY name").all() as {id: string; name: string}[]).map(item => ({id: item.id, name: item.name})),
    humans: (db.prepare("SELECT id,name FROM users WHERE status='active' ORDER BY name").all() as {id: string; name: string}[]).map(item => ({id: item.id, name: item.name})),
    clients: (db.prepare("SELECT id,name FROM clients WHERE status='active' ORDER BY name").all() as {id: string; name: string}[]).map(item => ({id: item.id, name: item.name})),
    companies: (db.prepare("SELECT id,name FROM companies ORDER BY name").all() as {id: string; name: string}[]).map(item => ({id: item.id, name: item.name})),
  };
}
