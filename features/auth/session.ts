import "server-only";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {createToken,verifyToken} from "./token";
import {roles, type SessionUser} from "./types";
import {getDb} from "@/server/db";
export const SESSION_COOKIE="morifar_session";
export async function getSession(){
 const token=await verifyToken((await cookies()).get(SESSION_COOKIE)?.value);if(!token)return null;
 const user=getDb().prepare("SELECT u.id,u.name,u.email,u.avatar,r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? AND u.status='active'").get(token.id) as SessionUser|undefined;
 return user&&(roles as readonly string[]).includes(user.role)?{...user}:null;
}
export async function requireSession(){const user=await getSession();if(!user)redirect("/login");return user}
export async function requireExecutiveSession(){const user=await requireSession();if(!["Super Admin","CEO","COO","CTO Reviewer"].includes(user.role))redirect("/dashboard?denied=1");return user}
export async function requireCtoSession(){const user=await requireSession();if(!["Super Admin","CEO","CTO Reviewer"].includes(user.role))redirect("/dashboard?denied=1");return user}
export async function requireCtoOwnerSession(){const user=await requireSession();if(!["Super Admin","CEO"].includes(user.role))redirect("/dashboard?denied=1");return user}
export async function requireSuperAdminSession(){const user=await requireSession();if(user.role!=="Super Admin")redirect("/dashboard?denied=1");return user}
export async function setSession(user:SessionUser){(await cookies()).set(SESSION_COOKIE,await createToken(user),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:28800})}
export async function clearSession(){(await cookies()).delete(SESSION_COOKIE)}

export async function requireOperatorSession(){const user=await requireSession();if(user.role==="CTO Reviewer")throw new Error("Read-only reviewer cannot modify operational records");return user}

export async function requirePrivateClientOperator(){const user=await requireSession();if(!["Super Admin","CEO","COO"].includes(user.role))throw new Error("Private client changes require an authorized executive");return user}
