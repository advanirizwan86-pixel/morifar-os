"use server";
import {redirect} from "next/navigation";
import {getDb,verifyPassword} from "@/server/db";
import {clearSession,setSession} from "./session";
import type {Role,SessionUser} from "./types";
export type LoginState={error?:string};
export async function login(_:LoginState,formData:FormData):Promise<LoginState>{const email=String(formData.get("email")??"").trim().toLowerCase();const password=String(formData.get("password")??"");if(!email||password.length<8)return{error:"Enter a valid email and password."};const row=getDb().prepare("SELECT u.id,u.name,u.email,u.password_hash,u.avatar,r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE lower(u.email)=? AND u.status='active'").get(email) as {id:string;name:string;email:string;password_hash:string;avatar:string;role:Role}|undefined;if(!row||!verifyPassword(password,row.password_hash))return{error:"Email or password is incorrect."};const user:SessionUser={id:row.id,name:row.name,email:row.email,avatar:row.avatar,role:row.role};getDb().prepare("UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?").run(row.id);await setSession(user);redirect("/dashboard")}
export async function logout(){await clearSession();redirect("/login")}
