import "server-only";
import {getDb} from "@/server/db";

export const formationStatuses=[
 "lead",
 "application_started",
 "documents_pending",
 "documents_verified",
 "trade_name",
 "initial_approval",
 "license_processing",
 "visa_processing",
 "completed",
] as const;

export const documentTypes=["Passport","Visa","Emirates ID","Trade License","MOA","POA","Utility Bill","Bank Statement","Photographs"] as const;

export type FormationStatus=typeof formationStatuses[number];

export type FormationApplication={
 id:string;
 company_id:string;
 client_id:string|null;
 company_name:string;
 client_name:string|null;
 jurisdiction:string;
 structure_type:string;
 business_activity:string;
 shareholders:string;
 managers:string;
 visa_allocation:number;
 office_requirement:string;
 current_status:FormationStatus;
 consultant_name:string|null;
 ai_name:string|null;
 progress:number;
 notes:string|null;
 internal_comments:string|null;
 required_documents:string;
 priority:string;
 updated_at:string;
};

export type DocumentRequest={
 id:string;
 document_type:string;
 status:string;
 expiry_date:string|null;
 client_name:string|null;
 company_name:string|null;
 application_id:string|null;
 reviewed_by_name:string|null;
 notes:string|null;
 updated_at:string;
};

export type ApprovalRow={
 id:string;
 entity_type:string;
 entity_id:string;
 title:string;
 status:string;
 requested_by_name:string|null;
 assigned_to_name:string|null;
 ai_name:string|null;
 priority:string;
 reason:string|null;
 decision_notes:string|null;
 updated_at:string;
};

export type TimelineEntry={
 id:string;
 source:string;
 actor:string;
 action:string;
 entity_type:string;
 entity_id:string;
 detail:string;
 created_at:string;
};

export type AuditLogRow={
 id:string;
 actor_type:string;
 actor_name:string;
 entity_type:string;
 entity_id:string;
 action:string;
 before_value:string|null;
 after_value:string|null;
 ip_address:string;
 reason:string|null;
 created_at:string;
};

export type QueueItem={
 id:string;
 department_name:string;
 entity_type:string;
 entity_id:string;
 title:string;
 priority:string;
 status:string;
 assigned_user:string|null;
 assigned_ai:string|null;
 due_date:string|null;
 updated_at:string;
};

function scalar(sql:string,params:(string|number)[]=[]){
 return Number((getDb().prepare(sql).get(...params) as {value:number}).value);
}

export function getBusinessOperationsDashboard(){
 const db=getDb();
 return {
  metrics:{
   applications:scalar("SELECT COUNT(*) value FROM company_applications"),
   activeApplications:scalar("SELECT COUNT(*) value FROM company_applications WHERE current_status!='completed'"),
   documentsPending:scalar("SELECT COUNT(*) value FROM document_requests WHERE status='pending'"),
   approvalsPending:scalar("SELECT COUNT(*) value FROM approvals WHERE status='pending'"),
   queueOpen:scalar("SELECT COUNT(*) value FROM department_queue_items WHERE status IN ('open','in_progress')"),
   auditEvents:scalar("SELECT COUNT(*) value FROM audit_logs"),
  },
  applications:listFormationApplications(),
  documents:listDocumentRequests(),
  approvals:listApprovals(),
  timeline:listTimeline(),
  queues:listDepartmentQueueItems(),
 };
}

export function listFormationApplications(status="all"){
 const db=getDb();
 return db.prepare(`
  SELECT a.*,co.name company_name,c.name client_name,u.name consultant_name,ai.name ai_name
  FROM company_applications a
  JOIN companies co ON co.id=a.company_id
  LEFT JOIN clients c ON c.id=a.client_id
  LEFT JOIN users u ON u.id=a.assigned_consultant_id
  LEFT JOIN ai_professionals ai ON ai.id=a.assigned_ai_id
  WHERE (?='all' OR a.current_status=?)
  ORDER BY CASE a.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,a.updated_at DESC
 `).all(status,status) as FormationApplication[];
}

export function getFormationApplication(id:string){
 const db=getDb();
 const application=db.prepare(`
  SELECT a.*,co.name company_name,c.name client_name,u.name consultant_name,ai.name ai_name
  FROM company_applications a
  JOIN companies co ON co.id=a.company_id
  LEFT JOIN clients c ON c.id=a.client_id
  LEFT JOIN users u ON u.id=a.assigned_consultant_id
  LEFT JOIN ai_professionals ai ON ai.id=a.assigned_ai_id
  WHERE a.id=?
 `).get(id) as FormationApplication|undefined;
 if(!application)return null;
 const statusLogs=db.prepare("SELECT l.*,u.name user_name FROM formation_status_logs l LEFT JOIN users u ON u.id=l.user_id WHERE application_id=? ORDER BY created_at DESC").all(id) as {id:string;from_status:string|null;to_status:string;user_name:string|null;notes:string|null;created_at:string}[];
 const documents=listDocumentRequests({applicationId:id});
 return {application,statusLogs,documents};
}

export function listDocumentRequests(filter:{status?:string;applicationId?:string}={}){
 const db=getDb(),status=filter.status??"all",applicationId=filter.applicationId??"all";
 return db.prepare(`
  SELECT d.*,c.name client_name,co.name company_name,u.name reviewed_by_name
  FROM document_requests d
  LEFT JOIN clients c ON c.id=d.client_id
  LEFT JOIN companies co ON co.id=d.company_id
  LEFT JOIN users u ON u.id=d.reviewed_by
  WHERE (?='all' OR d.status=?) AND (?='all' OR d.application_id=?)
  ORDER BY CASE d.status WHEN 'rejected' THEN 0 WHEN 'pending' THEN 1 WHEN 'uploaded' THEN 2 WHEN 'approved' THEN 3 ELSE 4 END,d.updated_at DESC
 `).all(status,status,applicationId,applicationId) as DocumentRequest[];
}

export function listApprovals(status="all"){
 const db=getDb();
 return db.prepare(`
  SELECT a.*,rq.name requested_by_name,ass.name assigned_to_name,ai.name ai_name
  FROM approvals a
  LEFT JOIN users rq ON rq.id=a.requested_by
  LEFT JOIN users ass ON ass.id=a.assigned_to
  LEFT JOIN ai_professionals ai ON ai.id=a.ai_professional_id
  WHERE (?='all' OR a.status=?)
  ORDER BY CASE a.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,a.updated_at DESC
 `).all(status,status) as ApprovalRow[];
}

export function listTimeline(entityType="all",entityId="all"){
 const db=getDb();
 const activityRows=(db.prepare(`
  SELECT a.id,'activity' source,COALESCE(u.name,ai.name,'Morifar OS') actor,a.action,a.entity_type,a.entity_id,a.metadata detail,a.created_at
  FROM activities a
  LEFT JOIN users u ON a.actor_type='user' AND u.id=a.actor_id
  LEFT JOIN ai_professionals ai ON a.actor_type='ai' AND ai.id=a.actor_id
  WHERE (?='all' OR a.entity_type=?) AND (?='all' OR a.entity_id=?)
 `).all(entityType,entityType,entityId,entityId) as TimelineEntry[]).map(row=>({...row,detail:row.detail??"{}"}));
 const auditRows=(db.prepare(`
  SELECT l.id,'audit' source,COALESCE(u.name,ai.name,l.actor_type) actor,l.action,l.entity_type,l.entity_id,COALESCE(l.reason,'') detail,l.created_at
  FROM audit_logs l
  LEFT JOIN users u ON l.actor_type='user' AND u.id=l.actor_id
  LEFT JOIN ai_professionals ai ON l.actor_type='ai' AND ai.id=l.actor_id
  WHERE (?='all' OR l.entity_type=?) AND (?='all' OR l.entity_id=?)
 `).all(entityType,entityType,entityId,entityId) as TimelineEntry[]);
 return [...activityRows,...auditRows].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,80);
}

export function listAuditLogs(){
 const db=getDb();
 return db.prepare(`
  SELECT l.*,COALESCE(u.name,ai.name,l.actor_type) actor_name
  FROM audit_logs l
  LEFT JOIN users u ON l.actor_type='user' AND u.id=l.actor_id
  LEFT JOIN ai_professionals ai ON l.actor_type='ai' AND ai.id=l.actor_id
  ORDER BY l.created_at DESC
  LIMIT 150
 `).all() as AuditLogRow[];
}

export function listDepartmentQueueItems(filter:{department?:string;status?:string;q?:string}={}){
 const db=getDb(),department=filter.department??"all",status=filter.status??"all",term=`%${filter.q??""}%`;
 return db.prepare(`
  SELECT q.*,d.name department_name,u.name assigned_user,ai.name assigned_ai
  FROM department_queue_items q
  JOIN departments d ON d.id=q.department_id
  LEFT JOIN users u ON u.id=q.assigned_user_id
  LEFT JOIN ai_professionals ai ON ai.id=q.assigned_ai_id
  WHERE (?='all' OR q.department_id=?)
   AND (?='all' OR q.status=?)
   AND (q.title LIKE ? OR q.entity_type LIKE ? OR q.priority LIKE ?)
  ORDER BY CASE q.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,COALESCE(q.due_date,q.updated_at)
 `).all(department,department,status,status,term,term,term) as QueueItem[];
}

export function businessFormOptions(){
 const db=getDb();
 return {
  companies:db.prepare("SELECT id,name FROM companies ORDER BY name").all() as {id:string;name:string}[],
  clients:db.prepare("SELECT id,name,email FROM clients ORDER BY name").all() as {id:string;name:string;email:string}[],
  users:db.prepare("SELECT id,name FROM users WHERE status='active' ORDER BY name").all() as {id:string;name:string}[],
  ai:db.prepare("SELECT id,name FROM ai_professionals ORDER BY name").all() as {id:string;name:string}[],
  departments:db.prepare("SELECT id,name FROM departments WHERE id IN ('dept_formation','dept_executive','dept_sales','dept_legal') ORDER BY name").all() as {id:string;name:string}[],
 };
}
