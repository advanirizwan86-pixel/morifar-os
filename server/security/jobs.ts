import "server-only";
import {newId} from "@/server/db";
import {privateClientDb} from "@/server/private-client/repository";
import {daysUntil,expiryBand,clientStages} from "@/server/private-client/policy";
import {securityDb} from "./store";
export function weekKey(now:Date){const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dubai",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);const d=new Date(day+"T00:00:00Z");d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
export function runNotificationJobs(now=new Date()){
 const db=securityDb();privateClientDb();db.exec("CREATE TABLE IF NOT EXISTS weekly_update_drafts(id TEXT PRIMARY KEY,case_id TEXT NOT NULL REFERENCES private_client_cases(id),week TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',approved_by TEXT REFERENCES users(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(case_id,week))");
 const managers=db.prepare("SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE u.status='active' AND r.name IN ('Super Admin','CEO','COO')").all() as {id:string}[];let notifications=0,drafts=0;
 function notify(key:string,userId:string,type:string,title:string,message:string,entity:string,id:string){const notificationId=newId("notification");const result=db.prepare("INSERT OR IGNORE INTO notification_deliveries(dedupe_key,notification_id) VALUES (?,?)").run(`${key}:${userId}`,notificationId);if(result.changes){db.prepare("INSERT INTO notifications(id,user_id,type,title,message,entity_type,entity_id) VALUES (?,?,?,?,?,?,?)").run(notificationId,userId,type,title,message,entity,id);notifications++;}}
 db.exec("BEGIN IMMEDIATE");try{
 const expiries=db.prepare("SELECT e.*,c.reference,c.owner_id FROM private_client_expiries e JOIN private_client_cases c ON c.id=e.case_id").all() as {id:string;case_id:string;reference:string;owner_id:string;kind:string;due_date:string}[];
 for(const e of expiries){const days=daysUntil(e.due_date,now);if(days>90)continue;const band=expiryBand(days);for(const user of new Set([e.owner_id,...managers.map(m=>m.id)]))notify(`expiry:${e.id}:${e.due_date}:${band}`,user,"expiry",`${e.kind}: ${band}`,`${e.reference}: ${e.kind} due ${e.due_date}` ,"private_client_case",e.case_id);}
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dubai",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const tasks=db.prepare("SELECT id,title,deadline,assigned_user_id FROM tasks WHERE deadline IS NOT NULL AND status!='done'").all() as {id:string;title:string;deadline:string;assigned_user_id:string|null}[];
 for(const t of tasks){let overdue=false;try{overdue=/^\d{4}-\d{2}-\d{2}$/.test(t.deadline)?daysUntil(t.deadline,now)<0:Date.parse(t.deadline)<now.getTime();}catch{continue;}if(!overdue)continue;for(const user of new Set([...managers.map(m=>m.id),...(t.assigned_user_id?[t.assigned_user_id]:[])]))notify(`overdue:${t.id}:${today}`,user,"task_overdue","Overdue assigned task",`Task ${t.id} is overdue since ${t.deadline}`,"task",t.id);}
 const cases=db.prepare("SELECT id,reference,stage,owner_id FROM private_client_cases").all() as {id:string;reference:string;stage:number;owner_id:string}[];
 for(const c of cases){const id=newId("draft"),week=weekKey(now);const checks=db.prepare("SELECT title,done FROM private_client_checks WHERE case_id=? ORDER BY rowid").all(c.id) as {title:string;done:number}[];const body=`Case ${c.reference} is at ${clientStages[c.stage]}. Completed: ${checks.filter(x=>x.done).length}. Outstanding: ${checks.filter(x=>!x.done).map(x=>x.title).join('; ')||'None'}. Staff must verify progress and next steps before sending.`;
 const result=db.prepare("INSERT OR IGNORE INTO weekly_update_drafts(id,case_id,week,body) VALUES (?,?,?,?)").run(id,c.id,week,body);if(result.changes)drafts++;
 for(const user of new Set([c.owner_id,...managers.map(m=>m.id)]))notify(`weekly:${c.id}:${week}`,user,"weekly_draft","Weekly client update requires review",`${c.reference}: weekly draft is ready for staff review. Nothing has been sent.` ,"private_client_case",c.id);}
 db.exec("COMMIT");return {notifications,drafts};
 }catch(e){db.exec("ROLLBACK");throw e;}
}
