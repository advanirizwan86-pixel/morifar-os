export const aiStatuses = ["Online", "Working", "Waiting", "Needs Review", "Offline"] as const;
export type AiStatus = typeof aiStatuses[number];

export const aiTaskStatuses = ["todo", "in_progress", "review", "done", "rejected", "escalated"] as const;
export type AiTaskStatus = typeof aiTaskStatuses[number];

export type CommandCenterProfessional = {
  id: string;
  name: string;
  avatar: string;
  department: string;
  jobTitle: string;
  status: AiStatus;
  currentTask: string | null;
  assignedClient: string | null;
  progress: number;
  confidence: number;
  priority: string | null;
  lastActivity: string;
  workload: number;
  performanceScore: number;
  isPaused: boolean;
};

export type CommandCenterTask = {
  id: string;
  title: string;
  aiProfessionalId: string;
  aiName: string;
  clientId: string | null;
  clientName: string | null;
  department: string;
  priority: string;
  dueDate: string | null;
  status: AiTaskStatus;
  confidence: number;
  progress: number;
  requiresHumanReview: boolean;
  reviewStatus: string;
};

export type CommandCenterActivity = {
  id: string;
  aiName: string;
  action: string;
  entityName: string;
  status: string;
  result: string;
  requiresApproval: boolean;
  createdAt: string;
};
