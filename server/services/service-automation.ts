import "server-only";
import {getDb} from "@/server/db";
import {listFormationApplications, listDocumentRequests, listApprovals, listTimeline, type DocumentRequest, type FormationApplication, type TimelineEntry} from "@/server/repositories/business-operations";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ChecklistStatus = "pending" | "completed" | "blocked" | "requires_review";
export type Recommendation = {title: string; why: string; action: string; priority: RiskLevel; requiresHumanApproval: true};
export type ValidationFinding = {documentType: string; status: ChecklistStatus; issue: string; why: string; recommendedAction: string};
export type GeneratedDraft = {type: string; title: string; body: string; mergeFields: string[]; requiresHumanReview: true};
export type CommunicationDraft = {channel: "Email" | "WhatsApp" | "Reminder" | "Follow-up" | "Missing Document Request" | "Status Update"; subject: string; body: string; why: string; requiresApprovalBeforeSending: true};
export type ComplianceItem = {label: string; status: ChecklistStatus; why: string};
export type CaseSummary = {client: string; company: string; caseHealth: number; riskScore: number; missingItems: string[]; recommendedNextAction: string; pendingApprovals: string[]; timeline: string; currentOwner: string; aiSummary: string; estimatedCompletion: string};

type RuleContext = {
  application?: FormationApplication;
  documents: DocumentRequest[];
  approvals: ReturnType<typeof listApprovals>;
};

type RecommendationRule = {
  id: string;
  label: string;
  appliesTo: "formation" | "document" | "case" | "compliance";
  evaluate: (context: RuleContext) => Recommendation | null;
};

export const serviceAutomationRules: RecommendationRule[] = [
  {
    id: "formation-next-step",
    label: "Formation next step",
    appliesTo: "formation",
    evaluate: ({application}) => {
      if (!application) return null;
      const map: Record<string, string> = {
        lead: "Open the application and confirm jurisdiction, activity and shareholders.",
        application_started: "Request the complete required document pack from the client.",
        documents_pending: "Validate uploaded documents and follow up on missing items.",
        documents_verified: "Prepare trade name reservation or government pre-approval pack.",
        trade_name: "Prepare Initial Approval application.",
        initial_approval: "Prepare license processing pack and payment checkpoint.",
        license_processing: "Track authority response and prepare visa allocation steps.",
        visa_processing: "Confirm establishment card and dependent visa requirements.",
        completed: "Prepare closure summary and renewal reminder.",
      };
      return {
        title: "AI recommendation: next formation action",
        why: `${application.company_name} is currently at ${application.current_status.replaceAll("_", " ")} with ${application.progress}% progress.`,
        action: map[application.current_status] ?? "Review the latest status and confirm the next human-approved milestone.",
        priority: application.priority === "urgent" ? "critical" : application.priority === "high" ? "high" : "medium",
        requiresHumanApproval: true,
      };
    },
  },
  {
    id: "missing-documents",
    label: "Missing or rejected document follow-up",
    appliesTo: "document",
    evaluate: ({application, documents}) => {
      const missing = documents.filter(doc => ["pending", "rejected"].includes(doc.status));
      if (!missing.length) return null;
      return {
        title: "AI recommendation: resolve document blocker",
        why: `${missing.length} document request(s) are pending or rejected${application ? ` for ${application.company_name}` : ""}.`,
        action: `Request or replace ${missing.slice(0, 3).map(doc => doc.document_type).join(", ")} before the next approval step.`,
        priority: missing.some(doc => doc.status === "rejected") ? "high" : "medium",
        requiresHumanApproval: true,
      };
    },
  },
  {
    id: "approval-blocker",
    label: "Human approval blocker",
    appliesTo: "case",
    evaluate: ({application, approvals}) => {
      const pending = approvals.filter(approval => approval.status === "pending" && (!application || approval.entity_id === application.id));
      if (!pending.length) return null;
      return {
        title: "AI recommendation: clear human approval",
        why: `${pending.length} approval item(s) require a human decision before sensitive work can proceed.`,
        action: `Review ${pending[0].title} and record approve, reject, request more information, or escalate.`,
        priority: pending.some(approval => approval.priority === "urgent") ? "critical" : "high",
        requiresHumanApproval: true,
      };
    },
  },
];

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function riskFrom(count: number): RiskLevel {
  return count >= 5 ? "critical" : count >= 3 ? "high" : count >= 1 ? "medium" : "low";
}

export class RecommendationEngine {
  constructor(private rules: RecommendationRule[] = serviceAutomationRules) {}
  recommend(context: RuleContext, appliesTo?: RecommendationRule["appliesTo"]) {
    return this.rules.filter(rule => !appliesTo || rule.appliesTo === appliesTo).map(rule => rule.evaluate(context)).filter(Boolean) as Recommendation[];
  }
}

export class DocumentValidationService {
  supportedDocuments = ["Passport", "Emirates ID", "Visa", "Trade License", "MOA", "POA", "Utility Bill", "Bank Statement", "Photograph", "Photographs"];
  validate(documents: DocumentRequest[]): ValidationFinding[] {
    return documents.map(document => {
      const expiresIn = daysUntil(document.expiry_date);
      if (!this.supportedDocuments.includes(document.document_type)) return {documentType: document.document_type, status: "requires_review", issue: "Unsupported document type", why: "The current rule pack does not recognise this document type.", recommendedAction: "Human reviewer should classify the file before approval."};
      if (document.status === "rejected") return {documentType: document.document_type, status: "blocked", issue: "Document previously rejected", why: document.notes ?? "A reviewer marked this document as rejected.", recommendedAction: "Request a replacement and keep final approval manual."};
      if (document.status === "pending") return {documentType: document.document_type, status: "pending", issue: "Document missing", why: "The request is still pending in the document checklist.", recommendedAction: "Send a missing document request draft to the client."};
      if (expiresIn !== null && expiresIn < 0) return {documentType: document.document_type, status: "blocked", issue: "Expired document", why: `${document.document_type} expired ${Math.abs(expiresIn)} day(s) ago.`, recommendedAction: "Request a renewed document before proceeding."};
      if (expiresIn !== null && expiresIn <= 45) return {documentType: document.document_type, status: "requires_review", issue: "Document expires soon", why: `${document.document_type} expires in ${expiresIn} day(s).`, recommendedAction: "Human reviewer should decide whether renewal is needed before banking or government filing."};
      return {documentType: document.document_type, status: "completed", issue: "No visible issue", why: "Status and expiry rules do not show a blocker.", recommendedAction: "Keep available for human final review."};
    });
  }
}

export class DocumentGenerationService {
  generate(application: FormationApplication, type: string): GeneratedDraft {
    const title = `${type} draft for ${application.company_name}`;
    const body = [
      `${type}`,
      `Company: ${application.company_name}`,
      `Jurisdiction: ${application.jurisdiction}`,
      `Structure: ${application.structure_type}`,
      `Business Activity: ${application.business_activity}`,
      `Shareholders: ${JSON.parse(application.shareholders).join(", ")}`,
      "Draft generated by Morifar OS. Human legal and compliance review is required before finalization.",
    ].join("\n");
    return {type, title, body, mergeFields: ["company_name", "jurisdiction", "structure_type", "business_activity", "shareholders"], requiresHumanReview: true};
  }
  templates = ["MOA", "Board Resolution", "Shareholder Resolution", "Power of Attorney", "Employment Agreement", "Offer Letter", "Service Agreement", "NDA", "Corporate Resolution"];
}

export class CommunicationService {
  createDraft(application: FormationApplication, channel: CommunicationDraft["channel"], missingDocuments: string[]): CommunicationDraft {
    const body = missingDocuments.length
      ? `Dear client, we are preparing the next step for ${application.company_name}. Please provide ${missingDocuments.join(", ")} so the team can continue after review.`
      : `Dear client, ${application.company_name} is currently at ${application.current_status.replaceAll("_", " ")}. Our team is preparing the next action and will confirm before any submission.`;
    return {
      channel,
      subject: `${application.company_name} - ${channel}`,
      body,
      why: missingDocuments.length ? "Missing documents are blocking the next formation milestone." : "A status update keeps the client informed without triggering an external action.",
      requiresApprovalBeforeSending: true,
    };
  }
}

export class ComplianceService {
  checklist(application: FormationApplication, documents: DocumentRequest[]): ComplianceItem[] {
    const uploaded = (type: string) => documents.some(doc => doc.document_type === type && ["uploaded", "approved"].includes(doc.status));
    return [
      {label: "Passport uploaded", status: uploaded("Passport") ? "completed" : "pending", why: "Identity proof is mandatory before formation and banking steps."},
      {label: "Trade Name Reserved", status: ["trade_name", "initial_approval", "license_processing", "visa_processing", "completed"].includes(application.current_status) ? "completed" : "pending", why: "Trade name reservation must precede initial approval."},
      {label: "Payment Received", status: application.progress > 40 ? "requires_review" : "pending", why: "Payment evidence is sensitive and requires finance confirmation."},
      {label: "KYC Complete", status: documents.filter(doc => ["pending", "rejected"].includes(doc.status)).length ? "blocked" : "requires_review", why: "KYC completion depends on complete and valid document evidence."},
      {label: "Shareholder Verified", status: JSON.parse(application.shareholders).length ? "requires_review" : "pending", why: "Shareholder identity must be reviewed by a human before final submission."},
      {label: "Compliance Approved", status: application.current_status === "completed" ? "completed" : "requires_review", why: "Final compliance approval cannot be automated."},
    ];
  }
}

export class CompanyFormationService {
  constructor(private recommendationEngine = new RecommendationEngine(), private compliance = new ComplianceService(), private validator = new DocumentValidationService()) {}
  workspace(application: FormationApplication) {
    const documents = listDocumentRequests({applicationId: application.id});
    const approvals = listApprovals();
    const recommendations = this.recommendationEngine.recommend({application, documents, approvals});
    const missingDocuments = documents.filter(doc => ["pending", "rejected"].includes(doc.status)).map(doc => doc.document_type);
    const riskSignals = missingDocuments.length + approvals.filter(item => item.status === "pending" && item.entity_id === application.id).length + (application.priority === "urgent" ? 2 : 0);
    return {
      application,
      currentStatus: application.current_status.replaceAll("_", " "),
      nextStep: recommendations[0]?.action ?? "Review the case and confirm the next human-approved step.",
      missingDocuments,
      requiredGovernmentActions: ["Reserve trade name", "Prepare initial approval", "Track license processing"].filter((_, index) => application.progress < 30 + index * 25),
      requiredClientActions: missingDocuments.length ? missingDocuments.map(item => `Provide ${item}`) : ["Confirm no changes to shareholder or manager details"],
      estimatedCompletion: application.priority === "urgent" ? "5-7 business days" : "10-15 business days",
      timeline: `${application.progress}% complete; updated ${new Date(application.updated_at).toLocaleDateString("en-AE", {day: "numeric", month: "short"})}`,
      riskLevel: riskFrom(riskSignals),
      recommendations,
      complianceChecklist: this.compliance.checklist(application, documents),
      documentFindings: this.validator.validate(documents),
    };
  }
}

export class CaseManagementService {
  buildCases(workspaces: ReturnType<CompanyFormationService["workspace"]>[]): CaseSummary[] {
    const approvals = listApprovals();
    return workspaces.map(workspace => {
      const missingCount = workspace.missingDocuments.length;
      const riskScore = Math.min(100, missingCount * 18 + (workspace.riskLevel === "critical" ? 35 : workspace.riskLevel === "high" ? 25 : workspace.riskLevel === "medium" ? 12 : 4));
      return {
        client: workspace.application.client_name ?? "No client linked",
        company: workspace.application.company_name,
        caseHealth: Math.max(0, 100 - riskScore),
        riskScore,
        missingItems: workspace.missingDocuments,
        recommendedNextAction: workspace.nextStep,
        pendingApprovals: approvals.filter(item => item.status === "pending" && item.entity_id === workspace.application.id).map(item => item.title),
        timeline: workspace.timeline,
        currentOwner: workspace.application.consultant_name ?? "Unassigned",
        aiSummary: `AI-generated: ${workspace.application.company_name} is ${workspace.currentStatus} with ${workspace.riskLevel} risk because ${workspace.recommendations[0]?.why ?? "no critical blocker is visible"}.`,
        estimatedCompletion: workspace.estimatedCompletion,
      };
    });
  }
}

export function getServiceAutomationDashboard() {
  const formationService = new CompanyFormationService();
  const generator = new DocumentGenerationService();
  const communicator = new CommunicationService();
  const applications = listFormationApplications();
  const workspaces = applications.map(application => formationService.workspace(application));
  const cases = new CaseManagementService().buildCases(workspaces);
  const first = workspaces[0];
  const timeline = listTimeline().map(enhanceTimelineEvent);
  const executiveMetrics = {
    revenuePipeline: "AED 142K",
    formationPipeline: applications.length,
    departmentWorkload: getDb().prepare("SELECT COUNT(*) value FROM department_queue_items WHERE status!='done'").get() as {value: number},
    casesDelayed: cases.filter(item => item.riskScore >= 50).length,
    casesAtRisk: cases.filter(item => item.riskScore >= 35).length,
    pendingApprovals: listApprovals("pending").length,
    averageProcessingTime: "126 min",
    dailyAiProductivity: getDb().prepare("SELECT SUM(current_workload) value FROM ai_professionals").get() as {value: number},
  };
  return {
    workspaces,
    cases,
    documentFindings: workspaces.flatMap(item => item.documentFindings),
    generatedDrafts: first ? generator.templates.slice(0, 5).map(type => generator.generate(first.application, type)) : [],
    communicationDrafts: first ? (["Email", "WhatsApp", "Missing Document Request", "Status Update"] as const).map(channel => communicator.createDraft(first.application, channel, first.missingDocuments)) : [],
    complianceItems: first?.complianceChecklist ?? [],
    executiveMetrics,
    timeline,
    rules: serviceAutomationRules.map(rule => ({id: rule.id, label: rule.label, appliesTo: rule.appliesTo})),
  };
}

function enhanceTimelineEvent(entry: TimelineEntry) {
  const type = entry.action.includes("approval") ? "Human Decision" : entry.action.includes("document") ? "Document Upload" : entry.action.includes("workflow") ? "Workflow Transition" : entry.source === "audit" ? "System Event" : entry.actor.includes("AI") ? "AI Recommendation" : "Task Completion";
  return {...entry, eventType: type};
}
