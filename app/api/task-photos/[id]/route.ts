import {NextResponse} from "next/server";
import {getSession} from "@/features/auth/session";
import {staffDb,taskForUser} from "@/server/security/staff";
import {securityAudit} from "@/server/security/store";
import {readPhoto} from "@/server/security/files";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const{id}=await params;const photo=staffDb().prepare("SELECT id,task_id,mime FROM task_photos WHERE id=?").get(id) as {id:string;task_id:string;mime:string}|undefined;if(!photo||!taskForUser(user,photo.task_id))return NextResponse.json({error:"Not found"},{status:404});const bytes=await readPhoto(id);securityAudit(user.id,"task_photo",id,"downloaded photo");return new NextResponse(new Uint8Array(bytes),{headers:{"Content-Type":photo.mime,"Content-Disposition":`attachment; filename="${id}.${photo.mime==="image/png"?"png":"jpg"}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}
