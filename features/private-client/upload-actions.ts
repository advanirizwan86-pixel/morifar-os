"use server";
import {revalidatePath} from "next/cache";
import {requireIdentity} from "@/features/auth/session";
import {newId} from "@/server/db";
import {taskForUser,staffDb} from "@/server/security/staff";
import {mayUpdateTask} from "@/server/security/permissions";
import {securityAudit} from "@/server/security/store";
import {maxPhotoBytes,photoMime,savePhoto,removePhoto} from "@/server/security/files";
export async function uploadTaskPhoto(form:FormData){const user=await requireIdentity(),taskId=String(form.get("task")??"");const task=taskForUser(user,taskId);if(!task||!mayUpdateTask(user,task.assigned_user_id))throw new Error("Task not available");const file=form.get("photo");if(!(file instanceof File)||file.size<12||file.size>maxPhotoBytes)throw new Error("Choose a JPEG or PNG photo no larger than 8 MB");const recent=staffDb().prepare("SELECT COUNT(*) count FROM task_photos WHERE uploaded_by=? AND created_at>=datetime('now','-15 minutes')").get(user.id) as {count:number};if(recent.count>=20)throw new Error("Upload limit reached. Please wait before trying again.");const bytes=Buffer.from(await file.arrayBuffer()),mime=photoMime(bytes),id=newId("photo");await savePhoto(id,bytes);const db=staffDb();db.exec("BEGIN IMMEDIATE");try{db.prepare("INSERT INTO task_photos(id,task_id,uploaded_by,mime,size) VALUES (?,?,?,?,?)").run(id,taskId,user.id,mime,bytes.length);securityAudit(user.id,"task_photo",id,"uploaded scanned encrypted photo");db.exec("COMMIT");}catch(e){db.exec("ROLLBACK");await removePhoto(id);throw e;}revalidatePath("/staff");}
