import {NextResponse} from "next/server";
import {getSession} from "@/features/auth/session";
import {getDb} from "@/server/db";
import {clientAssigned} from "@/server/security/staff";
import {securityAudit} from "@/server/security/store";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const{id}=await params;
 if(!["Super Admin","CEO","COO","Legal"].includes(user.role)||!clientAssigned(user,id))return NextResponse.json({error:"Not found"},{status:404});
 const db=getDb();const client=db.prepare("SELECT * FROM clients WHERE id=?").get(id);if(!client)return NextResponse.json({error:"Not found"},{status:404});
 const companyId=client.company_id??null;
 const related=(table:string)=>db.prepare(`SELECT * FROM ${table} WHERE client_id=? ORDER BY id`).all(id);
 const exportData={exportedAt:new Date().toISOString(),dataMode:"dummy",scope:"Known legacy client records. Document entries are metadata; this is not a certified complete CDD record.",client,company:companyId?db.prepare("SELECT * FROM companies WHERE id=?").get(companyId):null,documents:related("documents"),documentRequests:related("document_requests"),applications:related("company_applications"),tasks:related("tasks"),invoices:related("invoices"),audit:db.prepare("SELECT * FROM audit_logs WHERE (entity_type='client' AND entity_id=?) OR (entity_type='company' AND entity_id=?) ORDER BY created_at,id").all(id,companyId)};
 securityAudit(user.id,"client",id,"downloaded client compliance export");
 return new NextResponse(JSON.stringify(exportData,null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":"attachment; filename=morifar-client-export.json","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
