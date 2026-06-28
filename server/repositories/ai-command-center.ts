import "server-only";
import {getDb} from "@/server/db";
import type {
  AiStatus,
  CommandCenterActivity,
  CommandCenterProfessional,
  CommandCenterTask,
} from "@/features/ai-command-center/types";

type ProfessionalRow = {
  id: string;
  name: string;
  avatar: string;
  department: string;
  job_title: string;
  status: string;
  performance: number;
  last_activity: string;
  current_workload: number;
  is_paused: number;
  current_task: string | null;
  assigned_client: string | null;
  progress: number | null;
  confidence: number | null;
  priority: string | null;
  task_status: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  assigned_ai_id: string;
  ai_name: string;
  client_id: string | null;
  client_name: string | null;
  department: string;
  priority: string;
  deadline: string | null;
  status: CommandCenterTask["status"];
  confidence: number;
  progress: number;
  requires_human_review: number;
  review_status: string;
};

type ActivityRow = {
  id: string;
  ai_name: string | null;
  action: string;
  entity_name: string | null;
  metadata: string;
  created_at: string;
};

function displayStatus(row: ProfessionalRow): AiStatus {
  if (row.is_paused) return "Offline";
  if (row.task_status === "review") return "Needs Review";
  if (row.task_status === "in_progress") return "Working";
  if (row.task_status === "todo") return "Waiting";
  return row.status === "busy" ? "Working" : "Online";
}

function readMetadata(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getAiCommandCenterData() {
  const db = getDb();
  const professionalsRaw = db.prepare(`
    SELECT p.id,p.name,p.avatar,d.name department,p.job_title,p.status,p.performance,
      p.last_activity,p.current_workload,p.is_paused,
      t.title current_task,c.name assigned_client,t.progress,t.confidence,t.priority,t.status task_status
    FROM ai_professionals p
    LEFT JOIN departments d ON d.id=p.department_id
    LEFT JOIN tasks t ON t.id=(
      SELECT active.id FROM tasks active
      WHERE active.assigned_ai_id=p.id AND active.status IN ('in_progress','review','todo')
      ORDER BY CASE active.status WHEN 'in_progress' THEN 0 WHEN 'review' THEN 1 ELSE 2 END,
        active.updated_at DESC LIMIT 1
    )
    LEFT JOIN clients c ON c.id=t.client_id
    ORDER BY p.name
  `).all() as ProfessionalRow[];

  const professionals: CommandCenterProfessional[] = professionalsRaw.map(row => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    department: row.department,
    jobTitle: row.job_title,
    status: displayStatus(row),
    currentTask: row.current_task,
    assignedClient: row.assigned_client,
    progress: row.progress ?? 0,
    confidence: row.confidence ?? Math.round(row.performance),
    priority: row.priority,
    lastActivity: row.last_activity,
    workload: row.current_workload,
    performanceScore: Math.round(row.performance),
    isPaused: Boolean(row.is_paused),
  }));

  const taskRows = db.prepare(`
    SELECT t.id,t.title,t.assigned_ai_id,a.name ai_name,t.client_id,c.name client_name,
      COALESCE(d.name,'Unassigned') department,t.priority,t.deadline,t.status,t.confidence,
      t.progress,t.requires_human_review,t.review_status
    FROM tasks t
    JOIN ai_professionals a ON a.id=t.assigned_ai_id
    LEFT JOIN clients c ON c.id=t.client_id
    LEFT JOIN departments d ON d.id=COALESCE(t.department_id,a.department_id)
    WHERE t.parent_task_id IS NULL
    ORDER BY CASE t.status WHEN 'review' THEN 0 WHEN 'escalated' THEN 1 WHEN 'in_progress' THEN 2
      WHEN 'todo' THEN 3 WHEN 'rejected' THEN 4 ELSE 5 END,t.deadline
  `).all() as TaskRow[];

  const tasks: CommandCenterTask[] = taskRows.map(row => ({
    id: row.id,
    title: row.title,
    aiProfessionalId: row.assigned_ai_id,
    aiName: row.ai_name,
    clientId: row.client_id,
    clientName: row.client_name,
    department: row.department,
    priority: row.priority,
    dueDate: row.deadline,
    status: row.status,
    confidence: row.confidence,
    progress: row.progress,
    requiresHumanReview: Boolean(row.requires_human_review),
    reviewStatus: row.review_status,
  }));

  const activityRows = db.prepare(`
    SELECT activity.id,professional.name ai_name,activity.action,
      COALESCE(client.name,company.name,task.title,activity.entity_id) entity_name,
      activity.metadata,activity.created_at
    FROM activities activity
    LEFT JOIN ai_professionals professional ON activity.actor_type='ai' AND professional.id=activity.actor_id
    LEFT JOIN clients client ON activity.entity_type='client' AND client.id=activity.entity_id
    LEFT JOIN companies company ON activity.entity_type='company' AND company.id=activity.entity_id
    LEFT JOIN tasks task ON activity.entity_type='task' AND task.id=activity.entity_id
    WHERE activity.actor_type='ai' OR activity.entity_type='task'
    ORDER BY activity.created_at DESC LIMIT 16
  `).all() as ActivityRow[];

  const activities: CommandCenterActivity[] = activityRows.map(row => {
    const metadata = readMetadata(row.metadata);
    return {
      id: row.id,
      aiName: row.ai_name ?? String(metadata.aiName ?? "Morifar OS"),
      action: row.action,
      entityName: row.entity_name ?? "Internal operation",
      status: String(metadata.status ?? "completed"),
      result: String(metadata.result ?? "Recorded successfully"),
      requiresApproval: Boolean(metadata.requiresApproval),
      createdAt: row.created_at,
    };
  });

  const completedToday = Number((db.prepare(`
    SELECT COUNT(*) value FROM tasks WHERE status='done' AND date(completed_at)=date('now')
  `).get() as {value: number}).value);
  const failed = tasks.filter(task => ["rejected", "escalated"].includes(task.status)).length;
  const running = tasks.filter(task => task.status === "in_progress").length;
  const review = tasks.filter(task => task.status === "review" || task.reviewStatus === "pending").length;
  const completedRows = db.prepare(`
    SELECT CAST((julianday(completed_at)-julianday(created_at))*24*60 AS INTEGER) minutes
    FROM tasks WHERE completed_at IS NOT NULL AND date(completed_at)=date('now')
  `).all() as {minutes: number}[];
  const averageCompletionMinutes = completedRows.length
    ? Math.max(1, Math.round(completedRows.reduce((sum, row) => sum + row.minutes, 0) / completedRows.length))
    : 0;
  const averageConfidence = tasks.length
    ? Math.round(tasks.reduce((sum, task) => sum + task.confidence, 0) / tasks.length)
    : 0;
  const reviewedTasks = tasks.filter(task => task.requiresHumanReview).length;
  const productivity = professionals.length
    ? Math.round(professionals.reduce((sum, professional) => sum + professional.performanceScore, 0) / professionals.length)
    : 0;

  return {
    metrics: {
      totalProfessionals: professionals.length,
      activeProfessionals: professionals.filter(item => !item.isPaused).length,
      running,
      review,
      completedToday,
      failed,
      productivity,
    },
    performance: {
      completedToday,
      averageCompletionMinutes,
      averageConfidence,
      escalationRate: tasks.length ? Math.round((failed / tasks.length) * 100) : 0,
      humanReviewRate: tasks.length ? Math.round((reviewedTasks / tasks.length) * 100) : 0,
      failed,
    },
    professionals,
    tasks,
    activities,
    clients: (db.prepare(`
      SELECT c.id,c.name,co.name company_name FROM clients c
      LEFT JOIN companies co ON co.id=c.company_id WHERE c.status='active' ORDER BY c.name
    `).all() as {id: string; name: string; company_name: string | null}[])
      .map(client => ({id: client.id, name: client.name, company_name: client.company_name})),
    departments: (db.prepare("SELECT id,name FROM departments ORDER BY name").all() as {id: string; name: string}[])
      .map(department => ({id: department.id, name: department.name})),
  };
}
