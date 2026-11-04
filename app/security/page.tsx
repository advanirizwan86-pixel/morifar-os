import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {getSession} from "@/features/auth/session";
import {challenge,enrollmentSecret} from "@/server/security/store";
import {MfaForm} from "@/components/mfa-form";
export const dynamic="force-dynamic";
export default async function SecurityPage(){
 const user=await getSession(),c=challenge((await cookies()).get("morifar_mfa")?.value);if(!c&&!user)redirect("/login");
 const enrolling=!!c&&!c.auth.enabled;
 return <div className="page narrow-page"><h1>{user?"Account security":enrolling?"Set up mandatory two-factor login":"Verify your login"}</h1><section>{enrolling&&c&&<><p>Add this setup key to your authenticator app using a time-based, six-digit code. Keep the key private.</p><code>{enrollmentSecret(c.auth)}</code><p>Issuer: Morifar OS. Account: {c.email}. You must verify a code before you can access records.</p></>}</section><MfaForm enrolling={enrolling} authenticated={!!user}/></div>;
}
