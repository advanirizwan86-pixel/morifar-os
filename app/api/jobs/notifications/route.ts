import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {runNotificationJobs} from "@/server/security/jobs";
export const runtime="nodejs";
export async function POST(request:Request){const expected=process.env.MORIFAR_JOB_TOKEN,received=request.headers.get("authorization")??"";if(!expected||expected.length<32)return NextResponse.json({error:"Scheduler not configured"},{status:503});const a=Buffer.from(received),b=Buffer.from(`Bearer ${expected}`);if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Unauthorized"},{status:401});return NextResponse.json(runNotificationJobs(),{headers:{"Cache-Control":"no-store"}});}
