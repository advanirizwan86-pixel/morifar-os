export const RESET_CONFIRMATION = "RESET MORIFAR DEMO DATA";

export const resetTables = [
  {table: "task_comments", label: "Task comments"},
  {table: "workflow_audit_logs", label: "Workflow audit logs"},
  {table: "workflow_runs", label: "Workflow runs"},
  {table: "formation_status_logs", label: "Formation status logs"},
  {table: "document_requests", label: "Document requests"},
  {table: "department_queue_items", label: "Department queue items"},
  {table: "approvals", label: "Approvals"},
  {table: "documents", label: "Documents"},
  {table: "tasks", label: "Tasks"},
  {table: "company_applications", label: "Company formation demo cases"},
  {table: "invoices", label: "Invoices"},
  {table: "activities", label: "Activity timeline"},
  {table: "notifications", label: "Notifications"},
  {table: "ai_memory", label: "Demo AI memory/recommendations"},
  {table: "leads", label: "Leads"},
  {table: "clients", label: "Clients"},
  {table: "contacts", label: "Contacts"},
  {table: "companies", label: "Companies"},
] as const;

export const preservedRecords = [
  "Admin users and reviewer account",
  "Roles and permissions",
  "Departments",
  "Company Profile",
  "AI Professionals",
  "System Settings",
  "System Status and release documentation",
  "Workflow templates",
] as const;
