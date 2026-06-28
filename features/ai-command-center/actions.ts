"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireExecutiveSession} from "@/features/auth/session";
import {requiredText} from "@/features/shared/validation";
import {getDb, newId} from "@/server/db";

export type AssignAiTaskState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

function refreshCommandCenter() {
  revalidatePath("/ai-command-center");
  revalidatePath("/ai-professionals");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

function recordEvent(options: {
  userId: string;
  aiId: string;
  aiName: string;
  action: string;
  taskId: string;
  title: string;
  status: string;
  result: string;
  requiresApproval?: boolean;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO activities (id,actor_type,actor_id,action,entity_type,entity_id,metadata)
    VALUES (?,?,?,?,?,?,?)
  `).run(
    newId("activity"),
    "ai",
    options.aiId,
    options.action,
    "task",
    options.taskId,
    JSON.stringify({
      aiName: options.aiName,
      status: options.status,
      result: options.result,
      requiresApproval: Boolean(options.requiresApproval),
    }),
  );
  db.prepare(`
    INSERT INTO notifications (id,user_id,type,title,message,entity_type,entity_id)
    VALUES (?,?,?,?,?,?,?)
  `).run(
    newId("notification"),
    options.userId,
    "ai_task",
    options.title,
    options.result,
    "task",
    options.taskId,
  );
}

export async function assignAiTask(_: AssignAiTaskState, form: FormData): Promise<AssignAiTaskState> {
  const user = await requireExecutiveSession();
  const title = requiredText(form, "title", 3, 180);
  const description = requiredText(form, "description", 3, 2000);
  const aiId = String(form.get("aiProfessionalId") ?? "");
  const clientId = String(form.get("clientId") ?? "") || null;
  const departmentId = String(form.get("departmentId") ?? "");
  const priority = String(form.get("priority") ?? "medium");
  const dueDate = String(form.get("dueDate") ?? "");
  const requiresReview = form.get("requiresHumanReview") === "on";
  const errors: Record<string, string> = {};

  if (title.error) errors.title = title.error;
  if (description.error) errors.description = description.error;
  if (!["low", "medium", "high", "urgent"].includes(priority)) errors.priority = "Choose a valid priority.";
  if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) errors.dueDate = "Choose a valid due date.";

  const db = getDb();
  const ai = db.prepare("SELECT id,name,is_paused FROM ai_professionals WHERE id=?").get(aiId) as
    | {id: string; name: string; is_paused: number}
    | undefined;
  if (!ai) errors.aiProfessionalId = "Choose an AI professional.";
  if (ai?.is_paused) errors.aiProfessionalId = "Resume this AI professional before assigning work.";
  const department = db.prepare("SELECT id FROM departments WHERE id=?").get(departmentId);
  if (!department) errors.departmentId = "Choose a department.";
  const client = clientId
    ? db.prepare("SELECT id,company_id FROM clients WHERE id=? AND status='active'").get(clientId) as
        | {id: string; company_id: string | null}
        | undefined
    : undefined;
  if (clientId && !client) errors.clientId = "Choose an active client.";
  if (Object.keys(errors).length || !ai) return {errors};

  const id = newId("task");
  const reviewStatus = requiresReview ? "pending" : "not_required";
  db.prepare(`
    INSERT INTO tasks (
      id,title,description,priority,status,deadline,created_by,assigned_ai_id,client_id,
      company_id,department_id,confidence,progress,requires_human_review,review_status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id,
    title.value,
    description.value,
    priority,
    "todo",
    dueDate,
    user.id,
    ai.id,
    clientId,
    client?.company_id ?? null,
    departmentId,
    80,
    0,
    requiresReview ? 1 : 0,
    reviewStatus,
  );
  db.prepare(`
    UPDATE ai_professionals
    SET current_workload=MIN(10,current_workload+1),last_activity=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(ai.id);
  recordEvent({
    userId: user.id,
    aiId: ai.id,
    aiName: ai.name,
    action: `was assigned ${title.value}`,
    taskId: id,
    title: "AI task assigned",
    status: "queued",
    result: `${title.value} was added to ${ai.name}'s queue.`,
    requiresApproval: requiresReview,
  });
  refreshCommandCenter();
  return {success: true, message: `${title.value} was assigned to ${ai.name}.`};
}

export async function toggleAiPause(form: FormData) {
  const user = await requireExecutiveSession();
  const aiId = String(form.get("aiId") ?? "");
  const pause = String(form.get("pause") ?? "") === "true";
  const db = getDb();
  const ai = db.prepare("SELECT id,name FROM ai_professionals WHERE id=?").get(aiId) as
    | {id: string; name: string}
    | undefined;
  if (!ai) redirect("/ai-command-center?error=AI%20professional%20not%20found");
  db.prepare("UPDATE ai_professionals SET is_paused=?,status=?,last_activity=CURRENT_TIMESTAMP WHERE id=?")
    .run(pause ? 1 : 0, pause ? "offline" : "available", aiId);
  db.prepare(`
    INSERT INTO notifications (id,user_id,type,title,message,entity_type,entity_id)
    VALUES (?,?,?,?,?,?,?)
  `).run(
    newId("notification"),
    user.id,
    "ai_status",
    pause ? "AI professional paused" : "AI professional resumed",
    `${ai.name} is now ${pause ? "paused" : "available"}.`,
    "ai_professional",
    ai.id,
  );
  refreshCommandCenter();
  redirect(`/ai-command-center?notice=${encodeURIComponent(`${ai.name} ${pause ? "paused" : "resumed"}.`)}`);
}

async function getTaskForAction(taskId: string) {
  return getDb().prepare(`
    SELECT t.id,t.title,t.assigned_ai_id,a.name ai_name FROM tasks t
    JOIN ai_professionals a ON a.id=t.assigned_ai_id WHERE t.id=?
  `).get(taskId) as {id: string; title: string; assigned_ai_id: string; ai_name: string} | undefined;
}

async function updateTaskAndRedirect(
  form: FormData,
  status: "done" | "rejected" | "escalated",
  reviewStatus: "approved" | "rejected" | "escalated",
) {
  const user = await requireExecutiveSession();
  const taskId = String(form.get("taskId") ?? "");
  const task = await getTaskForAction(taskId);
  if (!task) redirect("/ai-command-center?error=Task%20not%20found");
  const db = getDb();
  db.prepare(`
    UPDATE tasks SET status=?,review_status=?,progress=?,
      completed_at=CASE WHEN ?='done' THEN CURRENT_TIMESTAMP ELSE completed_at END,
      updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(status, reviewStatus, status === "done" ? 100 : 0, status, taskId);
  db.prepare(`
    UPDATE ai_professionals SET current_workload=MAX(0,current_workload-1),last_activity=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(task.assigned_ai_id);
  const action = status === "done" ? "completed approved task" : status === "rejected" ? "received a rejected task" : "escalated task to a human";
  const result = status === "done"
    ? `${task.title} was approved and completed.`
    : status === "rejected"
      ? `${task.title} was rejected and returned for correction.`
      : `${task.title} was escalated for human handling.`;
  recordEvent({
    userId: user.id,
    aiId: task.assigned_ai_id,
    aiName: task.ai_name,
    action,
    taskId,
    title: `AI task ${reviewStatus}`,
    status,
    result,
    requiresApproval: status !== "done",
  });
  refreshCommandCenter();
  redirect(`/ai-command-center?notice=${encodeURIComponent(result)}`);
}

export async function approveAiTask(form: FormData) {
  return updateTaskAndRedirect(form, "done", "approved");
}

export async function rejectAiTask(form: FormData) {
  return updateTaskAndRedirect(form, "rejected", "rejected");
}

export async function escalateAiTask(form: FormData) {
  return updateTaskAndRedirect(form, "escalated", "escalated");
}

export async function reassignAiTask(form: FormData) {
  const user = await requireExecutiveSession();
  const taskId = String(form.get("taskId") ?? "");
  const aiId = String(form.get("aiId") ?? "");
  const db = getDb();
  const task = await getTaskForAction(taskId);
  const nextAi = db.prepare("SELECT id,name,is_paused FROM ai_professionals WHERE id=?").get(aiId) as
    | {id: string; name: string; is_paused: number}
    | undefined;
  if (!task || !nextAi || nextAi.is_paused) redirect("/ai-command-center?error=Unable%20to%20reassign%20task");
  if (task.assigned_ai_id !== nextAi.id) {
    db.prepare("UPDATE tasks SET assigned_ai_id=?,status='todo',progress=0,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(nextAi.id, task.id);
    db.prepare("UPDATE ai_professionals SET current_workload=MAX(0,current_workload-1) WHERE id=?")
      .run(task.assigned_ai_id);
    db.prepare(`
      UPDATE ai_professionals SET current_workload=MIN(10,current_workload+1),last_activity=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(nextAi.id);
  }
  recordEvent({
    userId: user.id,
    aiId: nextAi.id,
    aiName: nextAi.name,
    action: `was reassigned ${task.title}`,
    taskId: task.id,
    title: "AI task reassigned",
    status: "queued",
    result: `${task.title} was reassigned to ${nextAi.name}.`,
  });
  refreshCommandCenter();
  redirect(`/ai-command-center?notice=${encodeURIComponent(`${task.title} was reassigned to ${nextAi.name}.`)}`);
}
