import "server-only";
import {getDb,newId} from "@/server/db";
import {createHash,createHmac,randomBytes} from "node:crypto";
import {base32,seal,open,verifyTotp} from "./crypto";
export function securityDb(){const db=getDb();db.exec(`
 CREATE TABLE IF NOT EXISTS user_security(user_id TEXT PRIMARY KEY REFERENCES users(id),secret BLOB NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,last_step INTEGER NOT NULL DEFAULT -1,version INTEGER NOT NULL DEFAULT 1,recovery_hashes TEXT NOT NULL DEFAULT '[]');
 CREATE TABLE IF NOT EXISTS auth_challenges(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL,version INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS auth_limits(bucket TEXT PRIMARY KEY,failures INTEGER NOT NULL DEFAULT 0,reset_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS task_photos(id TEXT PRIMARY KEY,task_id TEXT NOT NULL REFERENCES tasks(id),uploaded_by TEXT NOT NULL REFERENCES users(id),mime TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS notification_deliveries(dedupe_key TEXT PRIMARY KEY,notification_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 `);return db;}
export function securityAudit(actor:string|null,entity:string,id:string,action:string){securityDb().prepare("INSERT INTO audit_logs(id,actor_type,actor_id,entity_type,entity_id,action) VALUES (?,'user',?,?,?,?)").run(newId("audit"),actor,entity,id,action);}
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
function bucket(id:string){const key=process.env.AUTH_SECRET;if(!key)throw new Error("AUTH_SECRET required");return createHmac("sha256",key).update(id).digest("hex");}
export function limited(id:string){const row=securityDb().prepare("SELECT failures,reset_at FROM auth_limits WHERE bucket=?").get(bucket(id)) as {failures:number;reset_at:number}|undefined;return !!row&&row.reset_at>Date.now()&&row.failures>=5;}
export function failure(id:string){securityDb().prepare("INSERT INTO auth_limits(bucket,failures,reset_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET failures=CASE WHEN reset_at<? THEN 1 ELSE failures+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END").run(bucket(id),Date.now()+15*60000,Date.now(),Date.now());}
export function clearFailures(id:string){securityDb().prepare("DELETE FROM auth_limits WHERE bucket=?").run(bucket(id));}
export type SecurityRow={user_id:string;secret:Uint8Array;enabled:number;last_step:number;version:number;recovery_hashes:string};
export function userSecurity(id:string){return securityDb().prepare("SELECT * FROM user_security WHERE user_id=?").get(id) as SecurityRow|undefined;}
export function beginChallenge(id:string){const db=securityDb();let row=userSecurity(id);if(!row){const secret=seal(Buffer.from(base32(randomBytes(20))),undefined,`mfa:${id}`);db.prepare("INSERT INTO user_security(user_id,secret) VALUES (?,?)").run(id,secret);row=userSecurity(id)!;}
 const token=randomBytes(32).toString("hex");db.prepare("DELETE FROM auth_challenges WHERE expires<? OR user_id=?").run(Date.now(),id);db.prepare("INSERT INTO auth_challenges(token_hash,user_id,expires,version) VALUES (?,?,?,?)").run(hash(token),id,Date.now()+5*60000,row.version);return token;}
export function challenge(token:string|undefined){if(!token||!/^([a-f0-9]{64})$/.test(token))return null;const row=securityDb().prepare("SELECT c.*,u.email,u.status FROM auth_challenges c JOIN users u ON u.id=c.user_id WHERE c.token_hash=? AND c.expires>? AND c.attempts<5 AND u.status='active'").get(hash(token),Date.now()) as {token_hash:string;user_id:string;email:string;version:number}|undefined;const auth=row&&userSecurity(row.user_id);return row&&auth&&auth.version===row.version?{...row,auth}:null;}
export function enrollmentSecret(row:SecurityRow){if(row.enabled)throw new Error("Already enrolled");return open(Buffer.from(row.secret),undefined,`mfa:${row.user_id}`).toString();}
export function finishChallenge(token:string,code:string){const c=challenge(token);if(!c||limited(`mfa:${c.user_id}`))return null;const db=securityDb();db.exec("BEGIN IMMEDIATE");try{
 const row=userSecurity(c.user_id)!;const step=verifyTotp(open(Buffer.from(row.secret),undefined,`mfa:${row.user_id}`).toString(),code,row.last_step);
 let recovery:string[]|undefined;
 const hashes=JSON.parse(row.recovery_hashes) as string[];const recoveryIndex=row.enabled&&/^[a-f0-9]{32}$/.test(code)?hashes.indexOf(hash(code)):-1;
 if(step===null&&recoveryIndex<0){db.prepare("UPDATE auth_challenges SET attempts=attempts+1 WHERE token_hash=?").run(c.token_hash);failure(`mfa:${c.user_id}`);db.exec("COMMIT");return null;}
 if(!row.enabled){recovery=Array.from({length:8},()=>randomBytes(16).toString("hex"));db.prepare("UPDATE user_security SET enabled=1,last_step=?,recovery_hashes=? WHERE user_id=?").run(step,JSON.stringify(recovery.map(hash)),c.user_id);}
 else if(recoveryIndex>=0){hashes.splice(recoveryIndex,1);db.prepare("UPDATE user_security SET recovery_hashes=?,version=version+1 WHERE user_id=?").run(JSON.stringify(hashes),c.user_id);}
 else {const updated=db.prepare("UPDATE user_security SET last_step=? WHERE user_id=? AND last_step<?").run(step,c.user_id,step);if(!updated.changes)throw new Error("Code already used");}
 db.prepare("DELETE FROM auth_challenges WHERE user_id=?").run(c.user_id);clearFailures(`mfa:${c.user_id}`);clearFailures(`password:${c.email}`);securityAudit(c.user_id,"authentication",c.user_id,recovery?"MFA enrolled":recoveryIndex>=0?"MFA recovery code used":"MFA login verified");db.exec("COMMIT");return {userId:c.user_id,version:userSecurity(c.user_id)!.version,recovery};
 }catch(e){db.exec("ROLLBACK");throw e;}}
