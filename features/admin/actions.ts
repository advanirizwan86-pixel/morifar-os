"use server";

import {getDb} from "@/server/db";
import {revalidatePath} from "next/cache";
import {RESET_CONFIRMATION} from "@/features/admin/data-reset";
import {requireSession} from "@/features/auth/session";
import {resetDemoData} from "@/server/repositories/data-reset";

export type DataResetState = {error?: string; deleted?: number; completed?: boolean};

export async function resetDemoDataAction(_: DataResetState, form: FormData): Promise<DataResetState> {
  const user = await requireSession();
  if (user.role !== "Super Admin") return {error: "Only Super Admin can reset demo data."};
  const confirmation = String(form.get("confirmation") ?? "").trim();
  if (confirmation !== RESET_CONFIRMATION) return {error: `Type ${RESET_CONFIRMATION} exactly to enable reset.`};
  const db=getDb();
  for(const table of ["task_photos","client_assignments"]){
    if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)){
      const row=db.prepare(`SELECT COUNT(*) count FROM ${table}`).get() as {count:number};
      if(row.count)return {error:"Demo reset is locked while task photos or staff client assignments exist. Use a fresh isolated dummy environment instead."};
    }
  }
  const preview = resetDemoData();
  const deleted = preview.reduce((sum, item) => sum + item.count, 0);
  revalidatePath("/");
  return {completed: true, deleted};
}

