"use server";

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
  const preview = resetDemoData();
  const deleted = preview.reduce((sum, item) => sum + item.count, 0);
  revalidatePath("/");
  return {completed: true, deleted};
}

