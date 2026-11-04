import "server-only";
import {getDb} from "@/server/db";
import type {SessionUser} from "@/features/auth/types";
import {securityDb,securityAudit} from "./store";
import {canManage,mayReadTask,maySeeContact,maySeeInvoices} from "./permissions";
export function staffDb(){const db=securityDb();db.exec("CREATE TABLE IF NOT EXISTS client_assignments(client_id TEXT NOT NULL REFERENCES clients(id),user_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(client_id,user_id))");return db;}
export function taskForUser(user:SessionUser,id:string){const row=staffDb().prepare("SELECT id,title,description,status,deadline,assigned_user_id FROM tasks WHERE id=?").get(id) as {id:string;title:string;description:string;status:string;deadline:string|null;assigned_user_id:string|null}|undefined;if(!row||!mayReadTask(user,row.assigned_user_id))return null;return {...row};}
export function staffWork(user:SessionUser){const db=staffDb();
 const tasks=db.prepare("SELECT id,title,description,status,deadline,assigned_user_id FROM tasks WHERE assigned_user_id=? ORDER BY deadline,id").all(user.id) as {id:string;title:string;description:string;status:string;deadline:string|null;assigned_user_id:string}[];
 const contacts=maySeeContact(user)?db.prepare("SELECT c.id,c.name,c.email,c.phone,c.country FROM clients c JOIN client_assignments a ON a.client_id=c.id WHERE a.user_id=? ORDER BY c.name").all(user.id):[];
 const invoices=maySeeInvoices(user)?db.prepare("SELECT i.id,i.client_id,i.amount,i.currency,i.status,i.due_date FROM invoices i JOIN client_assignments a ON a.client_id=i.client_id WHERE a.user_id=? ORDER BY i.due_date").all(user.id):[];
 const photos=db.prepare("SELECT p.id,p.task_id,p.created_at FROM task_photos p JOIN tasks t ON t.id=p.task_id WHERE t.assigned_user_id=? ORDER BY p.created_at DESC").all(user.id) as {id:string;task_id:string;created_at:string}[];
 for(const row of tasks)securityAudit(user.id,"task",row.id,"viewed assigned task");for(const row of contacts)securityAudit(user.id,"client",String(row.id),"viewed assigned contact fields");for(const row of invoices)securityAudit(user.id,"invoice",String(row.id),"viewed assigned invoice");
 return {tasks,contacts:contacts.map(r=>({...r})),invoices:invoices.map(r=>({...r})),photos};}
export function clientAssigned(user:SessionUser,clientId:string){return canManage(user)||!!staffDb().prepare("SELECT 1 FROM client_assignments WHERE client_id=? AND user_id=?").get(clientId,user.id);}
