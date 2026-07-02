export type HealthTone = "green" | "amber" | "red";

export type Insight = {
  title: string;
  detail: string;
  priority: "low" | "medium" | "high" | "urgent";
};

export type ClientHealthScore = {
  score: number;
  tone: HealthTone;
  label: string;
  breakdown: string[];
};

export type ClientIntelligence = {
  clientId: string;
  clientName: string;
  companyName: string;
  workflowStage: string;
  missingDocuments: string[];
  outstandingApprovals: string[];
  openTasks: string[];
  blockers: string[];
  recommendations: Insight[];
  suggestedNextAction: string;
  health: ClientHealthScore;
  briefing: {
    overview: string;
    currentProgress: string;
    recentActivity: string;
    outstandingIssues: string;
    recommendedNextSteps: string;
    aiObservations: string;
  };
};

export type TaskRecommendation = {
  departmentId: string;
  departmentName: string;
  consultantId: string;
  consultantName: string;
  aiId: string;
  aiName: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedCompletion: string;
  rationale: string[];
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  category: string;
  department: string;
  summary: string;
  tags: string[];
  updatedAt: string;
};

export type OperationsIntelligence = {
  departmentWorkload: {department: string; openItems: number; urgentItems: number}[];
  bottlenecks: Insight[];
  delayedCases: Insight[];
  pendingApprovals: number;
  averageCompletionTime: number;
  aiProductivity: {name: string; workload: number; performance: number; status: string}[];
  humanWorkload: {name: string; openTasks: number}[];
  healthDistribution: {tone: HealthTone; count: number}[];
};
