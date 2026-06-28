"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireSession} from "@/features/auth/session";
import {requiredText,validEmail} from "@/features/shared/validation";
import {getDb,newId} from "@/server/db";
import {documentTypes,formationStatuses} from "@/server/repositories/business-operations";

export type BusinessActionState={error?:string;success?:string;errors?:Record<string,string>};

function audit(userId:string,entityType:string,entityId:string,action:string,beforeValue:string|null,afterValue:string|null,reason:string|null){
 getDb().prepare("INSERT INTO audit_logs (id,actor_type,actor_id,entity_type,entity_id,action,before_value,after_value,reason) VALUES (?,?,?,?,?,?,?,?,?)")
  .run(newId("audit"),"user",userId,entityType,entityId,action,beforeValue,afterValue,reason);
 getDb().prepare("INSERT INTO activities (id,actor_type,actor_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?,?,?)")
  .run(newId("activity"),"user",userId,action.replaceAll("_"," "),entityType,entityId,JSON.stringify({before:beforeValue,after:afterValue,reason}));
}

function notify(userId:string,type:string,title:string,message:string,entityType:string,entityId:string){
 getDb().prepare("INSERT INTO notifications (id,user_id,type,title,message,entity_type,entity_id) VALUES (?,?,?,?,?,?,?)")
  .run(newId("notification"),userId,type,title,message,entityType,entityId);
}

export async function createCompanyApplication(_:BusinessActionState,form:FormData):Promise<BusinessActionState>{
 const user=await requireSession();
 const company=String(form.get("company")??""),client=String(form.get("client")??"")||null,consultant=String(form.get("consultant")??user.id),ai=String(form.get("ai")??"")||null;
 const fields=["jurisdiction","structure_type","business_activity","office_requirement"] as const;
 const values:Record<string,string>={},errors:Record<string,string>={};
 fields.forEach(key=>{const result=requiredText(form,key,2,250);values[key]=result.value;if(result.error)errors[key]=result.error});
 if(!company)errors.company="Choose a company";
 const visaAllocation=Number(form.get("visa_allocation")??0);
 if(!Number.isFinite(visaAllocation)||visaAllocation<0)errors.visa_allocation="Enter a valid visa allocation";
 if(Object.keys(errors).length)return{errors};
 const id=newId("app"),docs=JSON.stringify(documentTypes.slice(0,5));
 getDb().prepare("INSERT INTO company_applications (id,company_id,client_id,jurisdiction,structure_type,business_activity,shareholders,managers,visa_allocation,office_requirement,current_status,assigned_consultant_id,assigned_ai_id,progress,notes,internal_comments,required_documents,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
  .run(id,company,client,values.jurisdiction,values.structure_type,values.business_activity,JSON.stringify(String(form.get("shareholders")??"").split("\n").map(x=>x.trim()).filter(Boolean)),JSON.stringify(String(form.get("managers")??"").split("\n").map(x=>x.trim()).filter(Boolean)),visaAllocation,values.office_requirement,"application_started",consultant,ai,12,String(form.get("notes")??"").trim(),String(form.get("internal_comments")??"").trim(),docs,String(form.get("priority")??"medium"));
 getDb().prepare("INSERT INTO formation_status_logs (id,application_id,from_status,to_status,user_id,notes) VALUES (?,?,?,?,?,?)").run(newId("fsl"),id,"lead","application_started",user.id,"Application created");
 getDb().prepare("INSERT INTO workflow_runs (id,workflow_id,client_id,company_id,status,current_step_id,completed_steps,remaining_steps,elapsed_minutes,ai_actions,human_actions,started_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
  .run(newId("run"),"wf_company_formation",client,company,"running","intake",1,4,0,JSON.stringify([]),JSON.stringify(["Application created"]),user.id);
 getDb().prepare("INSERT INTO department_queue_items (id,department_id,entity_type,entity_id,title,priority,status,assigned_user_id,assigned_ai_id,due_date) VALUES (?,?,?,?,?,?,?,?,?,?)")
  .run(newId("queue"),"dept_formation","company_application",id,`Formation application ${values.jurisdiction}`,String(form.get("priority")??"medium"),"open",consultant,ai,new Date(Date.now()+86400000*3).toISOString());
 audit(user.id,"company_application",id,"created","lead","application_started","Company formation application opened");
 revalidatePath("/company-formation");
 revalidatePath("/department-queues");
 redirect(`/company-formation?created=${encodeURIComponent(id)}`);
}

export async function transitionFormationStatus(form:FormData){
 const user=await requireSession();
 const id=String(form.get("id")??""),next=String(form.get("next")??""),notes=String(form.get("notes")??"").trim();
 if(!formationStatuses.includes(next as never))return;
 const row=getDb().prepare("SELECT current_status,assigned_consultant_id FROM company_applications WHERE id=?").get(id) as {current_status:string;assigned_consultant_id:string|null}|undefined;
 if(!row||row.current_status===next)return;
 const progress=Math.round((formationStatuses.indexOf(next as never)+1)/formationStatuses.length*100);
 getDb().prepare("UPDATE company_applications SET current_status=?,progress=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(next,progress,id);
 getDb().prepare("INSERT INTO formation_status_logs (id,application_id,from_status,to_status,user_id,notes) VALUES (?,?,?,?,?,?)").run(newId("fsl"),id,row.current_status,next,user.id,notes||"Status transitioned");
 audit(user.id,"company_application",id,"status_changed",row.current_status,next,notes||"Formation status transition");
 if(row.assigned_consultant_id)notify(row.assigned_consultant_id,"formation","Formation status updated",`Application ${id} moved to ${next.replaceAll("_"," ")}`,"company_application",id);
 revalidatePath("/company-formation");
 revalidatePath(`/company-formation/${id}`);
}

export async function createClientOnboarding(_:BusinessActionState,form:FormData):Promise<BusinessActionState>{
 const user=await requireSession();
 const required=["client_name","company_name","phone","email","address","nationality","service_required","source","priority","risk_level"] as const;
 const values:Record<string,string>={},errors:Record<string,string>={};
 required.forEach(key=>{const result=requiredText(form,key,2,250);values[key]=result.value;if(result.error)errors[key]=result.error});
 if(values.email&&!validEmail(values.email))errors.email="Enter a valid email";
 if(Object.keys(errors).length)return{errors};
 const companyId=newId("co"),clientId=newId("cl"),referral=String(form.get("referral")??"").trim(),passport=String(form.get("passport")??"").trim(),emiratesId=String(form.get("emirates_id")??"").trim();
 getDb().prepare("INSERT INTO companies (id,name,country,industry,formation_status,owner_id) VALUES (?,?,?,?,?,?)").run(companyId,values.company_name,values.nationality,values.service_required,"onboarding",user.id);
 getDb().prepare("INSERT INTO clients (id,name,email,phone,country,company_id,consultant_id,tags,status) VALUES (?,?,?,?,?,?,?,?,?)").run(clientId,values.client_name,values.email,values.phone,values.nationality,companyId,user.id,JSON.stringify([values.service_required,values.priority,values.risk_level]),"active");
 getDb().prepare("INSERT INTO department_queue_items (id,department_id,entity_type,entity_id,title,priority,status,assigned_user_id,due_date) VALUES (?,?,?,?,?,?,?,?,?)").run(newId("queue"),"dept_sales","client",clientId,`Onboard ${values.client_name}`,values.priority,"open",user.id,new Date(Date.now()+86400000*2).toISOString());
 const onboardingMeta={address:values.address,source:values.source,referral,passport,emiratesId,riskLevel:values.risk_level};
 audit(user.id,"client",clientId,"onboarded",null,JSON.stringify(onboardingMeta),"Client onboarding wizard completed");
 notify(user.id,"client","Client profile created",`${values.client_name} was onboarded for ${values.service_required}`,"client",clientId);
 revalidatePath("/client-onboarding");
 revalidatePath("/crm");
 redirect(`/client-onboarding?created=${encodeURIComponent(clientId)}`);
}

export async function updateDocumentRequest(form:FormData){
 const user=await requireSession();
 const id=String(form.get("id")??""),status=String(form.get("status")??""),notes=String(form.get("notes")??"").trim(),expiry=String(form.get("expiry_date")??"")||null;
 if(!["pending","uploaded","rejected","approved"].includes(status))return;
 const row=getDb().prepare("SELECT status,client_id,company_id FROM document_requests WHERE id=?").get(id) as {status:string;client_id:string|null;company_id:string|null}|undefined;
 if(!row)return;
 getDb().prepare("UPDATE document_requests SET status=?,expiry_date=COALESCE(?,expiry_date),reviewed_by=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status,expiry,user.id,notes,id);
 if(status==="rejected"||status==="approved"){
  getDb().prepare("INSERT INTO approvals (id,entity_type,entity_id,title,status,requested_by,assigned_to,priority,reason) VALUES (?,?,?,?,?,?,?,?,?)")
   .run(newId("approval"),"document",id,`${status==="approved"?"Approved":"Rejected"} document request`,status,user.id,user.id,status==="rejected"?"high":"medium",notes||`Document ${status}`);
 }
 audit(user.id,"document",id,"document_reviewed",row.status,status,notes||"Document request updated");
 revalidatePath("/documents");
 revalidatePath("/approvals");
}

export async function decideApproval(form:FormData){
 const user=await requireSession();
 const id=String(form.get("id")??""),decision=String(form.get("decision")??""),notes=String(form.get("notes")??"").trim();
 const allowed=["approved","rejected","changes_requested","escalated"];
 if(!allowed.includes(decision))return;
 const row=getDb().prepare("SELECT status,entity_type,entity_id FROM approvals WHERE id=?").get(id) as {status:string;entity_type:string;entity_id:string}|undefined;
 if(!row)return;
 getDb().prepare("UPDATE approvals SET status=?,decision_notes=?,assigned_to=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(decision,notes,user.id,id);
 audit(user.id,"approval",id,"approval_decision",row.status,decision,notes||"Approval decision recorded");
 if(row.entity_type==="company_application"&&decision==="approved"){
  getDb().prepare("INSERT INTO department_queue_items (id,department_id,entity_type,entity_id,title,priority,status,assigned_user_id,due_date) VALUES (?,?,?,?,?,?,?,?,?)").run(newId("queue"),"dept_formation",row.entity_type,row.entity_id,"Continue approved formation step","high","open",user.id,new Date(Date.now()+86400000).toISOString());
 }
 revalidatePath("/approvals");
 revalidatePath("/department-queues");
}

export async function updateQueueItem(form:FormData){
 const user=await requireSession();
 const id=String(form.get("id")??""),status=String(form.get("status")??""),assignee=String(form.get("assigned_user")??"")||null;
 if(!["open","in_progress","blocked","done"].includes(status))return;
 const row=getDb().prepare("SELECT status FROM department_queue_items WHERE id=?").get(id) as {status:string}|undefined;
 if(!row)return;
 getDb().prepare("UPDATE department_queue_items SET status=?,assigned_user_id=COALESCE(?,assigned_user_id),updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status,assignee,id);
 audit(user.id,"department_queue_item",id,"queue_updated",row.status,status,"Queue item updated");
 revalidatePath("/department-queues");
}
