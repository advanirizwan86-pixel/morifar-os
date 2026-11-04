"use server";
import {cookies} from "next/headers";
import {getDb} from "@/server/db";
import {finishChallenge} from "@/server/security/store";
import {setSession} from "./session";
import type {SessionUser} from "./types";
export type MfaState={error?:string;recovery?:string[];verified?:boolean};
export async function verifySecondFactor(_:MfaState,form:FormData):Promise<MfaState>{
 const jar=await cookies(),token=jar.get("morifar_mfa")?.value;if(!token)return{error:"Sign in again to continue."};
 const result=finishChallenge(token,String(form.get("code")??"").replaceAll(" ","").trim());if(!result)return{error:"Code is invalid, expired or already used. After five failures, wait 15 minutes and sign in again."};
 const row=getDb().prepare("SELECT u.id,u.name,u.email,u.avatar,r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? AND u.status='active'").get(result.userId) as SessionUser|undefined;
 if(!row)return{error:"Account unavailable."};await setSession({...row,mfaVerified:true,authVersion:result.version});jar.delete("morifar_mfa");getDb().prepare("UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?").run(row.id);
 return {verified:true,recovery:result.recovery};
}
