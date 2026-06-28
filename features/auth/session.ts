import "server-only";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {createToken,verifyToken} from "./token";
import type {SessionUser} from "./types";
export const SESSION_COOKIE="morifar_session";
export async function getSession(){return verifyToken((await cookies()).get(SESSION_COOKIE)?.value)}
export async function requireSession(){const user=await getSession();if(!user)redirect("/login");return user}
export async function requireExecutiveSession(){const user=await requireSession();if(!["Super Admin","CEO","COO"].includes(user.role))redirect("/dashboard?denied=1");return user}
export async function setSession(user:SessionUser){(await cookies()).set(SESSION_COOKIE,await createToken(user),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:28800})}
export async function clearSession(){(await cookies()).delete(SESSION_COOKIE)}
