export const workflowNodeTypes = [
  "Start",
  "End",
  "Decision",
  "Approval",
  "Human Task",
  "AI Task",
  "Delay",
  "Notification",
  "Email",
  "Document Request",
  "Document Generation",
  "Company Formation",
  "Visa",
  "Banking",
  "Legal",
  "Accounting",
  "CRM Update",
  "Webhook",
  "API Call",
  "Condition",
  "Merge",
  "Split",
] as const;

export type WorkflowNodeType = typeof workflowNodeTypes[number];
export type WorkflowStatus = "draft" | "active" | "running" | "paused" | "completed" | "failed";
export type WorkflowPriority = "low" | "medium" | "high" | "urgent";

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  name: string;
  description: string;
  department: string;
  assignedAi: string;
  assignedHuman: string;
  estimatedDuration: string;
  inputs: string;
  outputs: string;
  conditions: string;
  escalationRules: string;
  retryRules: string;
  approvalRequired: boolean;
  priority: WorkflowPriority;
  status: string;
  x: number;
  y: number;
};

export type WorkflowEdge = {
  from: string;
  to: string;
};

export type WorkflowDefinition = {
  kind?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type WorkflowSummary = {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  department: string;
  country: string;
  priority: WorkflowPriority;
  status: WorkflowStatus;
  nodes: number;
  updatedAt: string;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  workflowName: string;
  client: string;
  company: string;
  currentStep: string;
  currentStepType: WorkflowNodeType | null;
  assignedAi: string;
  assignedHuman: string;
  progress: number;
  elapsedMinutes: number;
  riskLevel: "Low" | "Medium" | "High";
  status: string;
  aiActions: string[];
  humanActions: string[];
  errors: string[];
};

export type WorkflowAuditLog = {
  id: string;
  timestamp: string;
  user: string;
  ai: string;
  action: string;
  oldValue: string;
  newValue: string;
  notes: string;
};

export type WorkflowOption = {
  id: string;
  name: string;
};

export type WorkflowEngineData = {
  filters: {
    q?: string;
    status?: string;
    department?: string;
    country?: string;
    priority?: string;
    ai?: string;
    human?: string;
    date?: string;
  };
  metrics: {
    totalWorkflows: number;
    runningWorkflows: number;
    pausedWorkflows: number;
    completedToday: number;
    failedWorkflows: number;
    averageCompletionTime: number;
    aiTasksRunning: number;
    humanTasksPending: number;
  };
  workflows: WorkflowSummary[];
  selectedWorkflow: WorkflowSummary | null;
  selectedDefinition: WorkflowDefinition;
  runs: WorkflowRun[];
  auditLogs: WorkflowAuditLog[];
  departments: WorkflowOption[];
  countries: string[];
  aiProfessionals: WorkflowOption[];
  humans: WorkflowOption[];
  clients: WorkflowOption[];
  companies: WorkflowOption[];
};
