"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireExecutiveSession} from "@/features/auth/session";
import {getDb, newId} from "@/server/db";
import type {WorkflowDefinition, WorkflowPriority, WorkflowStatus} from "@/features/workflow-engine/types";

export type WorkflowSaveState = {success?: boolean; message?: string; error?: string};

function transaction<T>(db: ReturnType<typeof getDb>, work: () => T): T {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function refresh() {
  revalidatePath("/workflow-engine");
  revalidatePath("/dashboard");
}

function audit(options: {
  workflowId: string;
  runId?: string | null;
  userId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
}) {
  getDb().prepare(`
    INSERT INTO workflow_audit_logs (id,workflow_id,run_id,user_id,action,old_value,new_value,notes)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(newId("wal"), options.workflowId, options.runId ?? null, options.userId, options.action, options.oldValue ?? "", options.newValue ?? "", options.notes ?? "");
}

function parseDefinition(value: string): WorkflowDefinition | null {
  try {
    const parsed = JSON.parse(value) as WorkflowDefinition;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every(item => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWorkflow(_: WorkflowSaveState, form: FormData): Promise<WorkflowSaveState> {
  const user = await requireExecutiveSession();
  const id = String(form.get("workflowId") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const departmentId = String(form.get("departmentId") ?? "");
  const country = String(form.get("country") ?? "").trim() || "Global";
  const priority = String(form.get("priority") ?? "medium") as WorkflowPriority;
  const status = String(form.get("status") ?? "draft") as WorkflowStatus;
  const definitionValue = String(form.get("definition") ?? "");
  const definition = parseDefinition(definitionValue);
  if (!name || name.length < 3) return {error: "Workflow name must be at least 3 characters."};
  if (!definition || definition.nodes.length < 2) return {error: "Workflow must include at least two connected nodes."};
  if (!["low", "medium", "high", "urgent"].includes(priority)) return {error: "Choose a valid priority."};
  if (!["draft", "active", "running", "paused", "completed", "failed"].includes(status)) return {error: "Choose a valid status."};
  const db = getDb();
  const existing = id ? db.prepare("SELECT id,status,definition FROM workflows WHERE id=?").get(id) as {id: string; status: string; definition: string} | undefined : undefined;
  const workflowId = existing?.id ?? newId("wf");
  transaction(db, () => {
    if (existing) {
      db.prepare(`
        UPDATE workflows SET name=?,description=?,department_id=?,country=?,priority=?,status=?,active=?,definition=?,updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).run(name, description, departmentId || null, country, priority, status, ["active", "running"].includes(status) ? 1 : 0, JSON.stringify(definition), workflowId);
      audit({workflowId, userId: user.id, action: "updated workflow", oldValue: existing.status, newValue: status, notes: name});
    } else {
      db.prepare(`
        INSERT INTO workflows (id,name,description,department_id,country,priority,trigger_type,definition,status,active,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `).run(workflowId, name, description, departmentId || null, country, priority, "manual", JSON.stringify(definition), status, ["active", "running"].includes(status) ? 1 : 0, user.id);
      audit({workflowId, userId: user.id, action: "created workflow", newValue: status, notes: name});
    }
  });
  refresh();
  return {success: true, message: `${name} saved.`};
}

export async function startWorkflow(form: FormData) {
  const user = await requireExecutiveSession();
  const workflowId = String(form.get("workflowId") ?? "");
  const clientId = String(form.get("clientId") ?? "") || null;
  const companyId = String(form.get("companyId") ?? "") || null;
  const db = getDb();
  const workflow = db.prepare("SELECT id,name,status,definition FROM workflows WHERE id=?").get(workflowId) as {id: string; name: string; status: string; definition: string} | undefined;
  if (!workflow) redirect("/workflow-engine?error=Workflow%20not%20found");
  const definition = parseDefinition(workflow.definition) ?? {nodes: [], edges: []};
  const first = definition.nodes.find(node => node.type !== "Start") ?? definition.nodes[0];
  const completedSteps = definition.nodes.some(node => node.type === "Start") ? 1 : 0;
  const runId = newId("run");
  transaction(db, () => {
    db.prepare(`
      INSERT INTO workflow_runs (id,workflow_id,client_id,company_id,status,current_step_id,completed_steps,remaining_steps,elapsed_minutes,ai_actions,human_actions,started_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(runId, workflowId, clientId, companyId, "running", first?.id ?? null, completedSteps, Math.max(0, definition.nodes.length - completedSteps), 0, "[]", "[]", user.id);
    db.prepare("UPDATE workflows SET status='active',active=1,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(workflowId);
    audit({workflowId, runId, userId: user.id, action: "started workflow", oldValue: workflow.status, newValue: "running", notes: workflow.name});
  });
  refresh();
  redirect(`/workflow-engine?workflow=${encodeURIComponent(workflowId)}&notice=${encodeURIComponent(`${workflow.name} started.`)}`);
}

export async function pauseWorkflow(form: FormData) {
  const user = await requireExecutiveSession();
  const workflowId = String(form.get("workflowId") ?? "");
  const db = getDb();
  const workflow = db.prepare("SELECT status FROM workflows WHERE id=?").get(workflowId) as {status: string} | undefined;
  if (!workflow) redirect("/workflow-engine?error=Workflow%20not%20found");
  transaction(db, () => {
    db.prepare("UPDATE workflows SET status='paused',active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(workflowId);
    db.prepare("UPDATE workflow_runs SET status='paused',updated_at=CURRENT_TIMESTAMP WHERE workflow_id=? AND status='running'").run(workflowId);
    audit({workflowId, userId: user.id, action: "paused workflow", oldValue: workflow.status, newValue: "paused"});
  });
  refresh();
  redirect(`/workflow-engine?workflow=${encodeURIComponent(workflowId)}&notice=Workflow%20paused.`);
}

export async function resumeWorkflow(form: FormData) {
  const user = await requireExecutiveSession();
  const workflowId = String(form.get("workflowId") ?? "");
  const db = getDb();
  const workflow = db.prepare("SELECT status FROM workflows WHERE id=?").get(workflowId) as {status: string} | undefined;
  if (!workflow) redirect("/workflow-engine?error=Workflow%20not%20found");
  transaction(db, () => {
    db.prepare("UPDATE workflows SET status='active',active=1,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(workflowId);
    db.prepare("UPDATE workflow_runs SET status='running',updated_at=CURRENT_TIMESTAMP WHERE workflow_id=? AND status='paused'").run(workflowId);
    audit({workflowId, userId: user.id, action: "resumed workflow", oldValue: workflow.status, newValue: "active"});
  });
  refresh();
  redirect(`/workflow-engine?workflow=${encodeURIComponent(workflowId)}&notice=Workflow%20resumed.`);
}

export async function approvalAction(form: FormData) {
  const user = await requireExecutiveSession();
  const runId = String(form.get("runId") ?? "");
  const decision = String(form.get("decision") ?? "");
  const db = getDb();
  const run = db.prepare(`
    SELECT r.id,r.workflow_id,r.status,r.current_step_id,r.completed_steps,r.remaining_steps,r.human_actions,w.definition
    FROM workflow_runs r JOIN workflows w ON w.id=r.workflow_id WHERE r.id=?
  `).get(runId) as {id: string; workflow_id: string; status: string; current_step_id: string | null; completed_steps: number; remaining_steps: number; human_actions: string; definition: string} | undefined;
  if (!run || !["approve", "reject", "more_info", "reassign", "escalate"].includes(decision)) redirect("/workflow-engine?error=Unable%20to%20update%20approval.");
  const definition = parseDefinition(run.definition);
  const currentNode = definition?.nodes.find(node => node.id === run.current_step_id);
  if (!["running", "paused"].includes(run.status) || currentNode?.type !== "Approval") {
    redirect(`/workflow-engine?workflow=${encodeURIComponent(run.workflow_id)}&error=Approval%20is%20only%20available%20on%20an%20active%20approval%20step.`);
  }
  const actions = readStringArray(run.human_actions);
  actions.unshift(`Human approval action: ${decision.replaceAll("_", " ")}`);
  const nextStatus = decision === "reject" ? "failed" : decision === "approve" ? "completed" : "running";
  const endNode = definition?.nodes.find(node => node.type === "End");
  const completedSteps = decision === "approve" ? run.completed_steps + run.remaining_steps : run.completed_steps;
  const remainingSteps = decision === "approve" ? 0 : run.remaining_steps;
  const currentStepId = decision === "approve" ? endNode?.id ?? run.current_step_id : run.current_step_id;
  transaction(db, () => {
    db.prepare(`
      UPDATE workflow_runs SET status=?,current_step_id=?,completed_steps=?,remaining_steps=?,human_actions=?,completed_at=CASE WHEN ?='completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(nextStatus, currentStepId, completedSteps, remainingSteps, JSON.stringify(actions), nextStatus, runId);
    audit({workflowId: run.workflow_id, runId, userId: user.id, action: `approval ${decision}`, oldValue: run.status, newValue: nextStatus});
  });
  refresh();
  redirect(`/workflow-engine?workflow=${encodeURIComponent(run.workflow_id)}&notice=${encodeURIComponent(`Approval action recorded: ${decision.replaceAll("_", " ")}.`)}`);
}
