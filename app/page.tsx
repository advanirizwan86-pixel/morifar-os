import {requireSession as enforcePageAccess} from "@/features/auth/session";
import { redirect } from "next/navigation";

export default async function Home() {
 await enforcePageAccess();

  redirect("/dashboard");
}
