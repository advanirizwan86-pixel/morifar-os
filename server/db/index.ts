import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { tmpdir } from "node:os";

const globalDb=globalThis as unknown as {morifarDb?:DatabaseSync};
const defaultDbPath=process.env.VERCEL?join(tmpdir(),"morifar.db"):join(process.cwd(),"data","morifar.db");
const dbPath=process.env.MORIFAR_DATABASE_PATH??defaultDbPath;
function hashPassword(password:string,salt:string){return pbkdf2Sync(password,salt,210000,32,"sha512").toString("hex")}
function insertIgnore(db:DatabaseSync,sql:string,values:(string|number|null)[]){db.prepare(sql).run(...values)}
function ensureColumn(db:DatabaseSync,table:string,column:string,definition:string){
 const columns=db.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[];
 if(!columns.some(item=>item.name===column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
function migrate(db:DatabaseSync){
 ensureColumn(db,"ai_professionals","is_paused","INTEGER NOT NULL DEFAULT 0");
 ensureColumn(db,"tasks","company_id","TEXT REFERENCES companies(id)");
 ensureColumn(db,"tasks","department_id","TEXT REFERENCES departments(id)");
 ensureColumn(db,"tasks","confidence","INTEGER NOT NULL DEFAULT 80");
 ensureColumn(db,"tasks","progress","INTEGER NOT NULL DEFAULT 0");
 ensureColumn(db,"tasks","requires_human_review","INTEGER NOT NULL DEFAULT 0");
 ensureColumn(db,"tasks","review_status","TEXT NOT NULL DEFAULT 'not_required'");
 ensureColumn(db,"tasks","failure_reason","TEXT");
 ensureColumn(db,"workflows","description","TEXT");
 ensureColumn(db,"workflows","department_id","TEXT REFERENCES departments(id)");
 ensureColumn(db,"workflows","country","TEXT");
 ensureColumn(db,"workflows","priority","TEXT NOT NULL DEFAULT 'medium'");
 ensureColumn(db,"workflows","status","TEXT NOT NULL DEFAULT 'draft'");
 ensureColumn(db,"workflows","created_by","TEXT REFERENCES users(id)");
 ensureColumn(db,"workflows","updated_at","TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP");
 db.exec(`
  CREATE TABLE IF NOT EXISTS company_applications (id TEXT PRIMARY KEY,company_id TEXT NOT NULL REFERENCES companies(id),client_id TEXT REFERENCES clients(id),jurisdiction TEXT NOT NULL,structure_type TEXT NOT NULL,business_activity TEXT NOT NULL,shareholders TEXT NOT NULL DEFAULT '[]',managers TEXT NOT NULL DEFAULT '[]',visa_allocation INTEGER NOT NULL DEFAULT 0,office_requirement TEXT NOT NULL,current_status TEXT NOT NULL DEFAULT 'lead',assigned_consultant_id TEXT REFERENCES users(id),assigned_ai_id TEXT REFERENCES ai_professionals(id),progress INTEGER NOT NULL DEFAULT 0,notes TEXT,internal_comments TEXT,required_documents TEXT NOT NULL DEFAULT '[]',priority TEXT NOT NULL DEFAULT 'medium',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS formation_status_logs (id TEXT PRIMARY KEY,application_id TEXT NOT NULL REFERENCES company_applications(id) ON DELETE CASCADE,from_status TEXT,to_status TEXT NOT NULL,user_id TEXT REFERENCES users(id),notes TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS document_requests (id TEXT PRIMARY KEY,client_id TEXT REFERENCES clients(id),company_id TEXT REFERENCES companies(id),application_id TEXT REFERENCES company_applications(id),document_type TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',expiry_date TEXT,document_id TEXT REFERENCES documents(id),reviewed_by TEXT REFERENCES users(id),notes TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS approvals (id TEXT PRIMARY KEY,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,title TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',requested_by TEXT REFERENCES users(id),assigned_to TEXT REFERENCES users(id),ai_professional_id TEXT REFERENCES ai_professionals(id),priority TEXT NOT NULL DEFAULT 'medium',reason TEXT,decision_notes TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY,actor_type TEXT NOT NULL,actor_id TEXT,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,action TEXT NOT NULL,before_value TEXT,after_value TEXT,ip_address TEXT NOT NULL DEFAULT '0.0.0.0',reason TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS department_queue_items (id TEXT PRIMARY KEY,department_id TEXT NOT NULL REFERENCES departments(id),entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,title TEXT NOT NULL,priority TEXT NOT NULL DEFAULT 'medium',status TEXT NOT NULL DEFAULT 'open',assigned_user_id TEXT REFERENCES users(id),assigned_ai_id TEXT REFERENCES ai_professionals(id),due_date TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE INDEX IF NOT EXISTS idx_workflows_status_department ON workflows(status,department_id);
  CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status,updated_at);
  CREATE INDEX IF NOT EXISTS idx_company_applications_status ON company_applications(current_status,priority);
  CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status,document_type);
  CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status,priority);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type,entity_id,created_at);
  CREATE INDEX IF NOT EXISTS idx_department_queue_status ON department_queue_items(department_id,status,priority);
 `);
}
function workflowDefinition(kind:string){
 const base={nodes:[
  {id:"start",type:"Start",name:"Start",description:"Workflow begins",x:80,y:120,department:"Executive Office",assignedAi:"",assignedHuman:"",estimatedDuration:"5m",inputs:"Client request",outputs:"Workflow run",conditions:"",escalationRules:"Notify COO on stalled start",retryRules:"Retry once",approvalRequired:false,priority:"medium",status:"ready"},
  {id:"intake",type:"Human Task",name:"Validate request",description:"Confirm client, country and required documents",x:310,y:120,department:"Sales & Growth",assignedAi:"",assignedHuman:"Morifar Administrator",estimatedDuration:"45m",inputs:"Client request",outputs:"Validated brief",conditions:"Client profile exists",escalationRules:"Escalate after 4 hours",retryRules:"Request clarification",approvalRequired:false,priority:"high",status:"ready"},
  {id:"ai_review",type:"AI Task",name:"AI compliance review",description:"AI professional checks requirements and risk",x:560,y:120,department:"Legal & Compliance",assignedAi:"Aisha Al-Mansoori AI",assignedHuman:"",estimatedDuration:"20m",inputs:"Validated brief",outputs:"Compliance notes",conditions:"Documents uploaded",escalationRules:"Escalate low confidence",retryRules:"Retry with corrected input",approvalRequired:true,priority:"high",status:"ready"},
  {id:"approval",type:"Approval",name:"Manager approval",description:"Human approval before client-facing output",x:810,y:120,department:"Executive Office",assignedAi:"",assignedHuman:"Morifar Administrator",estimatedDuration:"30m",inputs:"Compliance notes",outputs:"Approved instruction",conditions:"Confidence above threshold",escalationRules:"Escalate rejection to COO",retryRules:"Request more information",approvalRequired:true,priority:"high",status:"ready"},
  {id:"end",type:"End",name:"Complete",description:"Workflow completes",x:1060,y:120,department:"Executive Office",assignedAi:"",assignedHuman:"",estimatedDuration:"5m",inputs:"Approved instruction",outputs:"Audit trail",conditions:"All required steps complete",escalationRules:"",retryRules:"",approvalRequired:false,priority:"medium",status:"ready"}
 ],edges:[{from:"start",to:"intake"},{from:"intake",to:"ai_review"},{from:"ai_review",to:"approval"},{from:"approval",to:"end"}]};
 return JSON.stringify({...base,kind});
}
function seedWorkflowTemplates(db:DatabaseSync,adminId:string){
 const templates=[
  ["wf_company_formation","Company Formation","Entity setup from enquiry to licence pack","dept_formation","United Arab Emirates","high"],
  ["wf_golden_visa","Golden Visa","Golden Visa assessment, documentation and review","dept_legal","United Arab Emirates","high"],
  ["wf_investor_visa","Investor Visa","Investor visa application orchestration","dept_legal","United Arab Emirates","medium"],
  ["wf_dependent_visa","Dependent Visa","Dependent visa document and approval workflow","dept_legal","United Arab Emirates","medium"],
  ["wf_corporate_bank","Corporate Bank Account","Corporate banking readiness and KYC workflow","dept_finance","United Arab Emirates","high"],
  ["wf_personal_bank","Personal Bank Account","Personal banking onboarding and KYC workflow","dept_finance","United Arab Emirates","medium"],
  ["wf_accounting_setup","Accounting Setup","Accounting system and chart-of-accounts setup","dept_finance","United Arab Emirates","medium"],
  ["wf_corporate_tax","Corporate Tax Registration","Corporate tax registration workflow","dept_finance","United Arab Emirates","high"],
  ["wf_vat_registration","VAT Registration","VAT registration readiness and filing workflow","dept_finance","United Arab Emirates","medium"],
  ["wf_trademark","Trademark Registration","Trademark search, filing and follow-up workflow","dept_legal","United Arab Emirates","medium"],
  ["wf_contract_drafting","Contract Drafting","Legal drafting, review and approval workflow","dept_legal","United Arab Emirates","high"],
  ["wf_client_onboarding","Client Onboarding","Client onboarding and internal handoff workflow","dept_sales","United Arab Emirates","medium"],
  ["wf_document_collection","Document Collection","Document request and completion workflow","dept_sales","United Arab Emirates","medium"],
  ["wf_license_renewal","License Renewal","Licence renewal monitoring and execution workflow","dept_formation","United Arab Emirates","high"]
 ];
 templates.forEach(t=>insertIgnore(db,"INSERT OR IGNORE INTO workflows (id,name,description,department_id,country,priority,trigger_type,definition,status,active,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)",[t[0],t[1],t[2],t[3],t[4],t[5],"manual",workflowDefinition(String(t[1]).toLowerCase().replaceAll(" ","_")),"active",1,adminId]));
 insertIgnore(db,"INSERT OR IGNORE INTO workflow_runs (id,workflow_id,client_id,company_id,status,current_step_id,completed_steps,remaining_steps,elapsed_minutes,ai_actions,human_actions,started_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",["run_license_renewal","wf_license_renewal","cl_nadia","co_qanara","running","approval",3,2,84,JSON.stringify(["Aisha Al-Mansoori AI reviewed licence activity list"]),JSON.stringify(["Operations validated trade licence renewal pack"]),adminId]);
 db.prepare("UPDATE workflow_runs SET current_step_id='approval',completed_steps=3,remaining_steps=2 WHERE id='run_license_renewal' AND current_step_id='ai_review'").run();
 insertIgnore(db,"INSERT OR IGNORE INTO workflow_runs (id,workflow_id,client_id,company_id,status,current_step_id,completed_steps,remaining_steps,elapsed_minutes,ai_actions,human_actions,started_by,completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)",["run_client_onboarding","wf_client_onboarding","cl_ethan","co_northline","completed","end",5,0,126,JSON.stringify(["Emma Clarke AI produced onboarding summary"]),JSON.stringify(["Consultant approved onboarding checklist"]),adminId]);
 insertIgnore(db,"INSERT OR IGNORE INTO workflow_audit_logs (id,workflow_id,run_id,user_id,action,old_value,new_value,notes) VALUES (?,?,?,?,?,?,?,?)",["wal_1","wf_license_renewal","run_license_renewal",adminId,"started workflow","draft","running","Seeded active renewal workflow"]);
}
function seedBusinessOperations(db:DatabaseSync,adminId:string){
 const requiredDocs=JSON.stringify(["Passport","Emirates ID","Trade License","MOA","Utility Bill"]);
 insertIgnore(db,"INSERT OR IGNORE INTO company_applications (id,company_id,client_id,jurisdiction,structure_type,business_activity,shareholders,managers,visa_allocation,office_requirement,current_status,assigned_consultant_id,assigned_ai_id,progress,notes,internal_comments,required_documents,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",["app_qanara","co_qanara","cl_nadia","Dubai Mainland","Mainland","Management consultancy",JSON.stringify(["Nadia Al Qasimi 100%"]),JSON.stringify(["Nadia Al Qasimi"]),2,"Ejari office required","documents_verified",adminId,"ai_aisha",38,"Renewal-aligned formation service expansion","Awaiting trade name options",requiredDocs,"high"]);
 insertIgnore(db,"INSERT OR IGNORE INTO company_applications (id,company_id,client_id,jurisdiction,structure_type,business_activity,shareholders,managers,visa_allocation,office_requirement,current_status,assigned_consultant_id,assigned_ai_id,progress,notes,internal_comments,required_documents,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",["app_azm","co_azm","cl_faisal","Riyadh","Mainland","Technology services",JSON.stringify(["Faisal Alotaibi 70%","Strategic Partner 30%"]),JSON.stringify(["Faisal Alotaibi"]),4,"Serviced office acceptable","initial_approval",adminId,"ai_sarah",62,"Saudi market-entry formation","Compliance reviewed shareholder pack",requiredDocs,"urgent"]);
 const statusLogs=[["fsl_1","app_qanara",null,"lead","Lead qualified"],["fsl_2","app_qanara","lead","application_started","Application opened"],["fsl_3","app_qanara","application_started","documents_pending","Documents requested"],["fsl_4","app_qanara","documents_pending","documents_verified","Documents verified"],["fsl_5","app_azm",null,"lead","Lead qualified"],["fsl_6","app_azm","lead","application_started","Application opened"],["fsl_7","app_azm","application_started","documents_pending","Documents requested"],["fsl_8","app_azm","documents_pending","documents_verified","Documents verified"],["fsl_9","app_azm","documents_verified","trade_name","Trade name prepared"],["fsl_10","app_azm","trade_name","initial_approval","Initial approval submitted"]];
 statusLogs.forEach(row=>insertIgnore(db,"INSERT OR IGNORE INTO formation_status_logs (id,application_id,from_status,to_status,user_id,notes) VALUES (?,?,?,?,?,?)",[row[0],row[1],row[2],row[3],adminId,row[4]]));
 const docs=[["docreq_1","cl_nadia","co_qanara","app_qanara","Passport","approved","2028-02-04"],["docreq_2","cl_nadia","co_qanara","app_qanara","Emirates ID","approved","2027-09-18"],["docreq_3","cl_nadia","co_qanara","app_qanara","Trade License","pending","2026-08-14"],["docreq_4","cl_faisal","co_azm","app_azm","Passport","approved","2029-01-11"],["docreq_5","cl_faisal","co_azm","app_azm","Bank Statement","rejected",null],["docreq_6","cl_faisal","co_azm","app_azm","Photographs","pending",null]];
 docs.forEach(row=>insertIgnore(db,"INSERT OR IGNORE INTO document_requests (id,client_id,company_id,application_id,document_type,status,expiry_date,reviewed_by,notes) VALUES (?,?,?,?,?,?,?,?,?)",[row[0],row[1],row[2],row[3],row[4],row[5],row[6],row[5]==="pending"?null:adminId,row[5]==="rejected"?"Statement older than 90 days":"Seeded checklist item"]));
 const approvals=[["appr_1","document","docreq_5","Review replacement bank statement","pending",adminId,adminId,"ai_sarah","high","Rejected document requires replacement"],["appr_2","company_application","app_azm","Approve initial approval submission","pending",adminId,adminId,"ai_sarah","urgent","Formation milestone needs human approval"],["appr_3","workflow_step","run_license_renewal","Manager approval: license renewal","approved",adminId,adminId,"ai_aisha","high","Workflow approval completed"]];
 approvals.forEach(row=>insertIgnore(db,"INSERT OR IGNORE INTO approvals (id,entity_type,entity_id,title,status,requested_by,assigned_to,ai_professional_id,priority,reason) VALUES (?,?,?,?,?,?,?,?,?,?)",row));
 const audits=[["aud_1","user",adminId,"company_application","app_azm","status_changed","trade_name","initial_approval","Initial approval submitted"],["aud_2","ai","ai_sarah","document","docreq_5","document_rejected","pending","rejected","Bank statement expired"],["aud_3","user",adminId,"workflow_run","run_license_renewal","workflow_event","approval_pending","approved","Manager approved workflow step"]];
 audits.forEach(row=>insertIgnore(db,"INSERT OR IGNORE INTO audit_logs (id,actor_type,actor_id,entity_type,entity_id,action,before_value,after_value,reason) VALUES (?,?,?,?,?,?,?,?,?)",row));
 const queues=[["q_formation_1","dept_formation","company_application","app_azm","Azm initial approval follow-up","urgent","open",adminId,"ai_sarah",1],["q_formation_2","dept_formation","company_application","app_qanara","Qanara trade name options","high","open",adminId,"ai_aisha",2],["q_sales_1","dept_sales","client","cl_ethan","Client onboarding completion","medium","open",adminId,"ai_emma",3],["q_legal_1","dept_legal","approval","appr_1","Replacement bank statement review","high","open",adminId,"ai_sarah",1],["q_executive_1","dept_executive","workflow_run","run_license_renewal","Workflow monitor exception review","medium","in_progress",adminId,"ai_amir",4]];
 queues.forEach(row=>insertIgnore(db,"INSERT OR IGNORE INTO department_queue_items (id,department_id,entity_type,entity_id,title,priority,status,assigned_user_id,assigned_ai_id,due_date) VALUES (?,?,?,?,?,?,?,?,?,?)",[row[0],row[1],row[2],row[3],row[4],row[5],row[6],row[7],row[8],new Date(Date.now()+Number(row[9])*86400000).toISOString()]));
 insertIgnore(db,"INSERT OR IGNORE INTO activities (id,actor_type,actor_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?,?,?)",["act_ops_1","user",adminId,"changed formation status","company_application","app_azm",JSON.stringify({from:"trade_name",to:"initial_approval"})]);
}
function upsertBootstrapUser(db:DatabaseSync){
 const bootstrapPassword=process.env.MORIFAR_BOOTSTRAP_PASSWORD;
 if(!bootstrapPassword||bootstrapPassword.length<12)return;
 const salt=crypto.randomUUID();
 const email=process.env.MORIFAR_BOOTSTRAP_EMAIL??"admin@morifar.local";
 const name=process.env.MORIFAR_BOOTSTRAP_NAME??"Morifar Administrator";
 const passwordHash=`${salt}:${hashPassword(bootstrapPassword,salt)}`;
 db.prepare(`
  INSERT INTO users (id,name,email,password_hash,role_id,department_id,avatar,status)
  VALUES (?,?,?,?,?,?,?,'active')
  ON CONFLICT(id) DO UPDATE SET
   name=excluded.name,
   email=excluded.email,
   password_hash=excluded.password_hash,
   role_id=excluded.role_id,
   department_id=excluded.department_id,
   avatar=excluded.avatar,
   status='active'
 `).run("usr_admin",name,email,passwordHash,"role_super_admin","dept_executive","MA");
}
function seedOperations(db:DatabaseSync){
 const admin=db.prepare("SELECT id FROM users ORDER BY created_at LIMIT 1").get() as {id:string}|undefined;if(!admin)return;
 const companies=[["co_qanara","Qanara Consulting","United Arab Emirates","Professional Services","CN-88421","2026-08-14","active"],["co_azm","Azm Technologies","Saudi Arabia","Technology","CR-101923","2026-07-21","formation"],["co_northline","Northline Group","Canada","Distribution","CA-77810","2026-11-02","active"]];
 companies.forEach(c=>insertIgnore(db,"INSERT OR IGNORE INTO companies (id,name,country,industry,registration_number,renewal_date,formation_status,owner_id) VALUES (?,?,?,?,?,?,?,?)",[...c,admin.id]));
 const clients=[["cl_nadia","Nadia Al Qasimi","nadia@qanara.ae","+971 50 234 0198","United Arab Emirates","co_qanara","ai_aisha","approved",["VIP","UAE"]],["cl_faisal","Faisal Alotaibi","faisal@azm.sa","+966 55 834 1120","Saudi Arabia","co_azm","ai_sarah","in_review",["Saudi","Technology"]],["cl_ethan","Ethan Laurent","ethan@northline.ca","+1 416 555 0182","Canada","co_northline","ai_emma","not_required",["Canada"]]] as const;
 clients.forEach(c=>insertIgnore(db,"INSERT OR IGNORE INTO clients (id,name,email,phone,country,company_id,consultant_id,ai_professional_id,visa_status,tags,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)",[c[0],c[1],c[2],c[3],c[4],c[5],admin.id,c[6],c[7],JSON.stringify(c[8]),"active"]));
 insertIgnore(db,"INSERT OR IGNORE INTO invoices (id,client_id,amount,currency,status,due_date,paid_at) VALUES (?,?,?,?,?,?,?)",["inv_1","cl_nadia",42500,"AED","paid","2026-06-15","2026-06-12"]);
 insertIgnore(db,"INSERT OR IGNORE INTO invoices (id,client_id,amount,currency,status,due_date,paid_at) VALUES (?,?,?,?,?,?,?)",["inv_2","cl_faisal",68500,"AED","paid","2026-06-22","2026-06-20"]);
 insertIgnore(db,"INSERT OR IGNORE INTO invoices (id,client_id,amount,currency,status,due_date,paid_at) VALUES (?,?,?,?,?,?,?)",["inv_3","cl_ethan",31000,"AED","sent","2026-07-10",null]);
 const leads=[["LD-1048","Nadia Al Qasimi","nadia@qanara.ae","+971 50 234 0198","United Arab Emirates","Company formation","$25k – $50k","Within 30 days","Dubai mainland consultancy","new","new","ai_aisha"],["LD-1047","James Whitmore","james@whitmore.co.uk","+44 7700 900456","United Kingdom","Market expansion","$50k – $100k","1–3 months","Middle East entity","contacted","discovery","ai_david"],["LD-1046","Faisal Alotaibi","faisal@azm.sa","+966 55 834 1120","Saudi Arabia","Company formation","$100k+","Within 30 days","Vision 2030 technology venture","qualified","proposal","ai_sarah"],["LD-1045","Priya Sharma","priya@newleaf.in","+91 98765 44321","India","Advisory","$10k – $25k","3–6 months","Cross-border advice","contacted","discovery","ai_arjun"],["LD-1044","Ethan Laurent","ethan@northline.ca","+1 416 555 0182","Canada","Market expansion","$25k – $50k","1–3 months","GCC distribution strategy","new","new","ai_emma"]];
 leads.forEach((l,i)=>{const date=new Date(Date.now()-i*86400000).toISOString();insertIgnore(db,"INSERT OR IGNORE INTO leads (id,name,email,whatsapp,country,service,budget,timeline,notes,status,stage,assigned_consultant_id,assigned_ai_id,tags,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[...l.slice(0,11),admin.id,l[11],"[]",date,date])});
 const tasks=[["tsk_1","Complete Azm MISA application","Review final shareholder documents","urgent","in_progress",2,"ai_sarah","cl_faisal"],["tsk_2","Prepare Qanara renewal pack","Confirm licence activities and office lease","high","todo",5,"ai_aisha","cl_nadia"],["tsk_3","Northline market-entry brief","Draft GCC distribution options","medium","review",1,"ai_emma","cl_ethan"],["tsk_4","Weekly executive pipeline report","Summarise commercial activity","medium","done",0,"ai_amir",null]];
 tasks.forEach(t=>{const now=new Date().toISOString();insertIgnore(db,"INSERT OR IGNORE INTO tasks (id,title,description,priority,status,deadline,created_by,assigned_user_id,assigned_ai_id,client_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",[...t.slice(0,5),new Date(Date.now()+(t[5] as number)*86400000).toISOString(),admin.id,admin.id,t[6] as string,t[7] as string|null,now,now])});
 const activities=[["act_1","ai","ai_sarah","updated formation checklist","company","co_azm"],["act_2","user",admin.id,"qualified lead","lead","LD-1046"],["act_3","ai","ai_emma","completed market research","task","tsk_3"],["act_4","system",null,"created renewal reminder","company","co_qanara"]];
 activities.forEach((a,i)=>insertIgnore(db,"INSERT OR IGNORE INTO activities (id,actor_type,actor_id,action,entity_type,entity_id,metadata,created_at) VALUES (?,?,?,?,?,?,?,?)",[...a,"{}",new Date(Date.now()-i*3600000).toISOString()]));
 const notifications=[["ntf_1","renewal","Renewal due soon","Azm Technologies renews in 23 days","company","co_azm"],["ntf_2","task_assigned","Task requires review","Northline market-entry brief is ready","task","tsk_3"],["ntf_3","new_lead","New qualified lead","Faisal Alotaibi moved to proposal","lead","LD-1046"]];
 notifications.forEach((n,i)=>insertIgnore(db,"INSERT OR IGNORE INTO notifications (id,user_id,type,title,message,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?,?,?)",[n[0],admin.id,...n.slice(1),new Date(Date.now()-i*3600000).toISOString()]));
 seedWorkflowTemplates(db,admin.id);
 seedBusinessOperations(db,admin.id);
}

function seed(db:DatabaseSync){
 const roles=["Super Admin","CEO","COO","Manager","Consultant","Sales","Finance","Legal","HR"];
 roles.forEach(name=>insertIgnore(db,"INSERT OR IGNORE INTO roles (id,name,permissions) VALUES (?,?,?)",[`role_${name.toLowerCase().replaceAll(" ","_")}`,name,JSON.stringify(name==="Super Admin"?["*"]:["dashboard:read","crm:read","tasks:read"])]));
 const departments=[["executive","Executive Office"],["formation","Company Formation"],["advisory","International Advisory"],["sales","Sales & Growth"],["finance","Finance"],["legal","Legal & Compliance"],["people","People & Culture"]];
 departments.forEach(([key,name])=>insertIgnore(db,"INSERT OR IGNORE INTO departments (id,name,description) VALUES (?,?,?)",[`dept_${key}`,name,`${name} operations`]));
 upsertBootstrapUser(db);
 const ais=[
 ["sarah","Sarah Al-Harbi AI","formation","Formation Intelligence Lead","Saudi Company Formation",["MISA licensing","Saudi regulations","Entity structuring"],["CRM","Tasks","Documents"]],
 ["aisha","Aisha Al-Mansoori AI","formation","UAE Market Entry Lead","UAE Company Formation",["Mainland setup","Free zones","Corporate tax"],["CRM","Tasks","Documents"]],
 ["david","David Morgan AI","advisory","UK Expansion Advisor","UK Expansion",["UK market entry","Tax residency","Commercial strategy"],["CRM","Research","Documents"]],
 ["emma","Emma Clarke AI","advisory","Canada Business Advisor","Canada Business",["Federal incorporation","Provincial compliance","Immigration"],["CRM","Research","Documents"]],
 ["arjun","Arjun Mehta AI","advisory","India Advisory Lead","India Advisory",["FDI policy","Market entry","Taxation"],["CRM","Research","Tasks"]],
 ["grace","Grace AI","executive","Private Client Director","Private Client Experience",["Concierge service","Family offices","Client experience"],["CRM","Calendar","Documents"]],
 ["amir","Amir AI","executive","General Manager Assistant","GM Assistant",["Executive operations","Reporting","Coordination"],["CRM","Tasks","Calendar","Documents"]]
 ] as const;
 ais.forEach((a,i)=>insertIgnore(db,"INSERT OR IGNORE INTO ai_professionals (id,name,avatar,department_id,job_title,specialisation,knowledge,system_prompt,skills,tools,status,performance,last_activity,current_workload) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[`ai_${a[0]}`,a[1],a[1].split(" ").map(x=>x[0]).join("").slice(0,2),`dept_${a[2]}`,a[3],a[4],JSON.stringify(a[5]),`Act as Morifar's ${a[3]}. Provide precise, compliant and commercially useful support.`,JSON.stringify(a[5]),JSON.stringify(a[6]),i===2?"busy":"available",92-i,new Date(Date.now()-i*2400000).toISOString(),i+2]));
 seedOperations(db);
 [["AE","United Arab Emirates","AED","English / Arabic"],["SA","Saudi Arabia","SAR","Arabic / English"],["GB","United Kingdom","GBP","English"],["CA","Canada","CAD","English / French"],["IN","India","INR","English / Hindi"]].forEach(c=>insertIgnore(db,"INSERT OR IGNORE INTO countries (code,name,currency,language) VALUES (?,?,?,?)",c));
 insertIgnore(db,"INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)",["company",JSON.stringify({name:"Morifar Group",timezone:"Asia/Dubai",currency:"AED",language:"English"})]);
}
export function getDb(){if(!globalDb.morifarDb){mkdirSync(dirname(dbPath),{recursive:true});const db=new DatabaseSync(dbPath);db.exec(readFileSync(join(process.cwd(),"server","db","schema.sql"),"utf8"));migrate(db);seed(db);globalDb.morifarDb=db}return globalDb.morifarDb}
export function verifyPassword(password:string,stored:string){const [salt,expected]=stored.split(":");if(!salt||!expected)return false;const actual=hashPassword(password,salt);return actual.length===expected.length&&timingSafeEqual(Buffer.from(actual),Buffer.from(expected))}
export function newId(prefix:string){return `${prefix}_${crypto.randomUUID().replaceAll("-","").slice(0,16)}`}
