export type RouteStatus = "Active" | "Draft" | "Placeholder" | "Deprecated";

export type SystemRoute = {
  route: string;
  pageName: string;
  purpose: string;
  module: string;
  requiredRole: string;
  status: RouteStatus;
  dataSource: string;
  relatedServices: string;
  relatedComponents: string;
  readyForRealUse: string;
  limitations: string;
};

export const ctoRoles = ["Super Admin", "CEO", "CTO Reviewer"] as const;
export const ctoStartRoles = ["Super Admin", "CEO", "CTO Reviewer"] as const;
export const executiveRoles = ["Super Admin", "CEO", "COO", "CTO Reviewer"] as const;

export const systemRoutes: SystemRoute[] = [
  {route: "/dashboard", pageName: "Dashboard", purpose: "Daily operating command centre for attention, pipeline, tasks and renewals.", module: "Operations", requiredRole: "Authenticated", status: "Active", dataSource: "Dashboard repository, SQLite operational tables", relatedServices: "dashboard repository", relatedComponents: "PageHeader, KPI cards, activity panels", readyForRealUse: "Yes for daily review", limitations: "Depends on durable database migration for live production-of-record use."},
  {route: "/crm", pageName: "CRM", purpose: "Client, company and pipeline overview.", module: "CRM", requiredRole: "Authenticated", status: "Active", dataSource: "clients, companies, leads", relatedServices: "crm repository", relatedComponents: "Entity cards, table panels", readyForRealUse: "Ready after demo data reset", limitations: "Lead-to-client conversion is still guided manually."},
  {route: "/leads", pageName: "Leads", purpose: "Manage incoming leads and sales qualification.", module: "CRM", requiredRole: "Authenticated", status: "Active", dataSource: "leads, users, ai_professionals", relatedServices: "crm actions", relatedComponents: "Lead tables, filters", readyForRealUse: "Ready after demo data reset", limitations: "No external email/CRM sync yet."},
  {route: "/leads/new", pageName: "Create Lead", purpose: "Capture a new lead and route it to human/AI support.", module: "CRM", requiredRole: "Authenticated", status: "Active", dataSource: "leads, users, ai_professionals", relatedServices: "create lead action", relatedComponents: "LeadForm", readyForRealUse: "Ready", limitations: "No duplicate detection beyond manual review."},
  {route: "/tasks", pageName: "Tasks", purpose: "Track operational work by status, priority and owner.", module: "Tasks", requiredRole: "Authenticated", status: "Active", dataSource: "tasks, clients, companies, users, ai_professionals", relatedServices: "tasks repository/actions", relatedComponents: "Kanban task board", readyForRealUse: "Ready after demo data reset", limitations: "No calendar integration yet."},
  {route: "/tasks/new", pageName: "Create Task", purpose: "Create operational tasks for humans or AI professionals.", module: "Tasks", requiredRole: "Authenticated", status: "Active", dataSource: "tasks, users, clients, ai_professionals", relatedServices: "task creation action", relatedComponents: "TaskForm", readyForRealUse: "Ready", limitations: "No recurring task engine yet."},
  {route: "/company-formation", pageName: "Company Formation", purpose: "Monitor formation applications, milestones and document readiness.", module: "Company Formation", requiredRole: "Authenticated", status: "Active", dataSource: "company_applications, document_requests, approvals", relatedServices: "business operations repository", relatedComponents: "Formation panels", readyForRealUse: "Ready after demo data reset", limitations: "No government API submission."},
  {route: "/documents", pageName: "Document Manager", purpose: "View document records and requested files.", module: "Documents", requiredRole: "Authenticated", status: "Active", dataSource: "documents, document_requests", relatedServices: "business operations repository", relatedComponents: "Document table", readyForRealUse: "Operational record ready", limitations: "File upload/storage is placeholder-level."},
  {route: "/approvals", pageName: "Approvals", purpose: "Human approval queue for sensitive or AI-assisted actions.", module: "Approvals", requiredRole: "Authenticated", status: "Active", dataSource: "approvals, users, ai_professionals", relatedServices: "business operations actions", relatedComponents: "Approval cards/forms", readyForRealUse: "Ready", limitations: "No external signature integration."},
  {route: "/department-queues", pageName: "Department Queues", purpose: "Department-level workload view.", module: "Operations", requiredRole: "Authenticated", status: "Active", dataSource: "department_queue_items, departments", relatedServices: "business operations repository", relatedComponents: "Queue tables", readyForRealUse: "Ready after demo data reset", limitations: "Queue automation rules are future work."},
  {route: "/business-operations", pageName: "Operations", purpose: "Operational workspace for cases, approvals, documents and queues.", module: "Operations", requiredRole: "Authenticated", status: "Active", dataSource: "business operations repository", relatedServices: "service and repository layer", relatedComponents: "BusinessOperationForms", readyForRealUse: "Ready after demo data reset", limitations: "No external integrations."},
  {route: "/service-automation", pageName: "Service Automation", purpose: "AI-assisted operational service execution panel.", module: "Service Automation", requiredRole: "Authenticated", status: "Active", dataSource: "service automation service, seeded operational records", relatedServices: "service-automation.ts", relatedComponents: "Service cards, AI explanations", readyForRealUse: "Pilot-ready with human review", limitations: "AI actions are simulated and require future model/backend integration."},
  {route: "/ai-professionals", pageName: "AI Professionals", purpose: "Directory of AI professionals and workload status.", module: "AI Workforce", requiredRole: "Authenticated", status: "Active", dataSource: "ai_professionals, ai_memory", relatedServices: "ai repository", relatedComponents: "Professional cards", readyForRealUse: "Ready as directory", limitations: "No live LLM execution per professional yet."},
  {route: "/ai-command-center", pageName: "AI Command Center", purpose: "Executive AI workforce control room.", module: "AI Workforce", requiredRole: "Super Admin, CEO, COO, CTO Reviewer", status: "Active", dataSource: "ai_command_center repository", relatedServices: "AI command center actions", relatedComponents: "AICommandCenter component", readyForRealUse: "Executive review-ready", limitations: "Pause/resume is local app state/repository driven."},
  {route: "/workflow-engine", pageName: "Workflow Engine", purpose: "Visual workflow builder and run monitor.", module: "Workflow", requiredRole: "Super Admin, CEO, COO, CTO Reviewer", status: "Active", dataSource: "workflows, workflow_runs, workflow_audit_logs", relatedServices: "workflow-engine actions/repository", relatedComponents: "WorkflowEngine component", readyForRealUse: "Template and planning ready", limitations: "No external durable workflow runtime yet."},
  {route: "/executive-copilot", pageName: "Executive Copilot", purpose: "Leadership decision support with AI-labelled recommendations.", module: "Intelligence", requiredRole: "Super Admin, CEO, COO, CTO Reviewer", status: "Active", dataSource: "intelligence service, operational tables", relatedServices: "intelligence service", relatedComponents: "IntelligencePanels", readyForRealUse: "Decision-support ready", limitations: "Recommendations are generated from local deterministic service logic."},
  {route: "/client-intelligence", pageName: "Client Intelligence", purpose: "Client health, blockers, briefings and next actions.", module: "Intelligence", requiredRole: "Authenticated", status: "Active", dataSource: "clients, tasks, documents, invoices", relatedServices: "intelligence service", relatedComponents: "Intelligence panels", readyForRealUse: "Ready after demo data reset", limitations: "Health scoring requires calibration with real operations."},
  {route: "/operations-intelligence", pageName: "Operations Intelligence", purpose: "Executive workload, risk and performance view.", module: "Intelligence", requiredRole: "Super Admin, CEO, COO, CTO Reviewer", status: "Active", dataSource: "tasks, approvals, workflows, documents", relatedServices: "intelligence service", relatedComponents: "Intelligence dashboard", readyForRealUse: "Ready for internal leadership", limitations: "No historical analytics warehouse yet."},
  {route: "/knowledge-base", pageName: "Knowledge Base", purpose: "SOPs, policies, checklists and templates.", module: "Knowledge", requiredRole: "Authenticated", status: "Active", dataSource: "Static repository content", relatedServices: "none", relatedComponents: "Knowledge panels", readyForRealUse: "Reference ready", limitations: "Semantic search is future work."},
  {route: "/settings", pageName: "Settings", purpose: "System administration, departments, roles, markets and settings links.", module: "Administration", requiredRole: "Super Admin, CEO, COO, CTO Reviewer", status: "Active", dataSource: "settings, roles, departments, countries", relatedServices: "settings actions", relatedComponents: "SettingsForm", readyForRealUse: "Ready", limitations: "User administration is not yet exposed."},
  {route: "/settings/company-profile", pageName: "Company Profile", purpose: "Master organization record for Morifar OS.", module: "Administration", requiredRole: "Super Admin, CEO edit; COO/CTO Reviewer read-only", status: "Active", dataSource: "settings.company_profile JSON", relatedServices: "company-profile repository", relatedComponents: "CompanyProfileForm", readyForRealUse: "Ready", limitations: "Logo uploads are placeholders."},
  {route: "/system-status", pageName: "System Status", purpose: "Version, phase, deployment, route health and risks.", module: "Administration", requiredRole: "Super Admin, CEO, COO, CTO Reviewer", status: "Active", dataSource: "package metadata, environment variables, route list", relatedServices: "session", relatedComponents: "Status cards", readyForRealUse: "Ready", limitations: "Route health is documented and smoke-tested separately."},
  {route: "/search", pageName: "Search", purpose: "Search clients, leads, tasks, companies and documents.", module: "Search", requiredRole: "Authenticated", status: "Active", dataSource: "search repository", relatedServices: "search repository", relatedComponents: "Search result list", readyForRealUse: "Ready", limitations: "No semantic search yet."},
  {route: "/notifications", pageName: "Notifications", purpose: "Operational notifications for users.", module: "Notifications", requiredRole: "Authenticated", status: "Active", dataSource: "notifications", relatedServices: "notification actions", relatedComponents: "Notification list", readyForRealUse: "Ready", limitations: "No email/push delivery yet."},
  {route: "/cto-start", pageName: "CTO Quick Start", purpose: "CTO landing page with inspection links and rollout order.", module: "CTO Access", requiredRole: "Super Admin, CEO, CTO Reviewer", status: "Active", dataSource: "System knowledge constants", relatedServices: "session", relatedComponents: "CTO cards", readyForRealUse: "Ready", limitations: "Documentation links open markdown files as app routes where available."},
  {route: "/cto-walkthrough", pageName: "CTO Walkthrough", purpose: "Plain-English walkthrough of the full system.", module: "CTO Access", requiredRole: "Super Admin, CEO, CTO Reviewer", status: "Active", dataSource: "System knowledge constants", relatedServices: "session", relatedComponents: "Walkthrough panels", readyForRealUse: "Ready", limitations: "Needs periodic update after each phase."},
  {route: "/system-map", pageName: "System Map", purpose: "Route-by-route inventory for audit and training.", module: "CTO Access", requiredRole: "Super Admin, CEO, CTO Reviewer", status: "Active", dataSource: "System route inventory", relatedServices: "none", relatedComponents: "Inventory table", readyForRealUse: "Ready", limitations: "Manual inventory must be maintained with new routes."},
  {route: "/admin/data-reset", pageName: "Data Reset", purpose: "Preview, export and clear demo operational data.", module: "Administration", requiredRole: "Super Admin", status: "Active", dataSource: "Operational SQLite tables", relatedServices: "data reset actions", relatedComponents: "DataResetPanel", readyForRealUse: "Ready with confirmation", limitations: "Export is JSON snapshot, not a full database backup."},
  {route: "/training", pageName: "Training", purpose: "Role-neutral training modules for everyday use.", module: "Training", requiredRole: "Authenticated", status: "Active", dataSource: "Static training content", relatedServices: "none", relatedComponents: "Training cards", readyForRealUse: "Ready", limitations: "No progress tracking yet."},
];

export const featureInventory = [
  "CRM",
  "Leads",
  "Tasks",
  "Company Formation",
  "Documents",
  "Approvals",
  "Department Queues",
  "AI Professionals",
  "AI Command Center",
  "Workflow Engine",
  "Executive Copilot",
  "Client Intelligence",
  "Operations Intelligence",
  "Knowledge Base",
  "Service Automation",
  "System Status",
  "Settings",
  "Search",
  "Notifications",
];

export const criticalRisks = [
  "Vercel SQLite storage is ephemeral and must be migrated before durable client records become production-of-record.",
  "AI recommendations are deterministic/local until live model orchestration is connected.",
  "Government, banking, email, payment, and document storage integrations are not live yet.",
  "Demo data must be reset before real operational use.",
];

export const rolloutOrder = [
  "Confirm Company Profile and Settings.",
  "Reset demo data and export a backup snapshot.",
  "Create first real lead.",
  "Qualify the lead and create a client/company record path.",
  "Create the company formation case.",
  "Assign tasks to consultants and AI professionals.",
  "Request and track documents.",
  "Use AI recommendations as explainable assistance only.",
  "Approve sensitive milestones manually.",
  "Review System Status and route smoke results after deployment.",
];

export const dailyFlow = [
  "Open Dashboard and identify what requires attention today.",
  "Review pending approvals and delayed tasks.",
  "Process new leads and route qualified opportunities.",
  "Check active formation cases and document requests.",
  "Read AI recommendations, verify the explanation, then decide manually.",
  "Use Search to find client, company, task or document records.",
  "End the day by clearing stale tasks and noting tomorrow priorities.",
];
