"use server";
import {revalidatePath} from "next/cache";
import {getDb} from "@/server/db";
import {requireSession} from "@/features/auth/session";
export type SettingsState={saved?:boolean;error?:string};
export async function saveCompanySettings(_:SettingsState,form:FormData):Promise<SettingsState>{const user=await requireSession();if(!["Super Admin","CEO","COO"].includes(user.role))return{error:"You do not have permission to update company settings."};const name=String(form.get("name")??"").trim(),timezone=String(form.get("timezone")??""),currency=String(form.get("currency")??""),language=String(form.get("language")??"");if(!name||!timezone||!currency||!language)return{error:"All company settings are required."};getDb().prepare("INSERT INTO settings (key,value,updated_at) VALUES ('company',?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").run(JSON.stringify({name,timezone,currency,language}));revalidatePath("/settings");return{saved:true}}
