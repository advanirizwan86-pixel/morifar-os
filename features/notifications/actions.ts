"use server";
import {revalidatePath} from "next/cache";
import {getDb} from "@/server/db";
import {requireSession} from "@/features/auth/session";
export async function markNotificationRead(form:FormData){const user=await requireSession();const id=String(form.get("id")??"");getDb().prepare("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?").run(id,user.id);revalidatePath("/notifications")}
export async function markAllRead(){const user=await requireSession();getDb().prepare("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL").run(user.id);revalidatePath("/notifications")}
