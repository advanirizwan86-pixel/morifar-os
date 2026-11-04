"use server";
import {redirect} from "next/navigation";
import {cookies} from "next/headers";
import {getDb,verifyPassword} from "@/server/db";
import {clearSession} from "./session";
import {beginChallenge,limited,failure} from "@/server/security/store";
export type LoginState={error?:string};
export async function login(_:LoginState,formData:FormData):Promise<LoginState>{
 const email=String(formData.get("email")??"").trim().toLowerCase(),password=String(formData.get("password")??"");
 if(!email||email.length>254||password.length<8||password.length>512)return{error:"Enter a valid email and password."};
 if(limited(`password:${email}`))return{error:"Too many attempts. Wait 15 minutes before trying again."};
 const row=getDb().prepare("SELECT id,password_hash FROM users WHERE lower(email)=? AND status='active'").get(email) as {id:string;password_hash:string}|undefined;
 const passwordValid=verifyPassword(password,row?.password_hash??("morifar-invalid:"+"0".repeat(64)));
 if(!row||!passwordValid){failure(`password:${email}`);return{error:"Email or password is incorrect."};}
 const token=beginChallenge(row.id);await clearSession();(await cookies()).set("morifar_mfa",token,{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/",maxAge:300});redirect("/security");
}
export async function logout(){await clearSession();(await cookies()).delete("morifar_mfa");redirect("/login");}
