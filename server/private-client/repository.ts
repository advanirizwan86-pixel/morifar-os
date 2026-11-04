import "server-only";
import {getDb,newId} from "@/server/db";
import {services} from "./policy";
export function privateClientDb(){const db=getDb();db.exec(`
 CREATE TABLE IF NOT EXISTS private_client_cases(id TEXT PRIMARY KEY,reference TEXT NOT NULL,service_id TEXT NOT NULL,stage INTEGER NOT NULL DEFAULT 0 CHECK(stage BETWEEN 0 AND 6),owner_id TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS private_client_checks(id TEXT PRIMARY KEY,case_id TEXT NOT NULL REFERENCES private_client_cases(id),title TEXT NOT NULL,done INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS private_client_expiries(id TEXT PRIMARY KEY,case_id TEXT NOT NULL REFERENCES private_client_cases(id),kind TEXT NOT NULL,due_date TEXT NOT NULL);
 `);return db;}
export function audit(actor:string,entity:string,id:string,action:string){privateClientDb().prepare("INSERT INTO audit_logs(id,actor_type,actor_id,entity_type,entity_id,action) VALUES (?,'user',?,?,?,?)").run(newId("audit"),actor,entity,id,action);}
export function createCase(actor:string,serviceId:string){const service=services.find(s=>s.id===serviceId);if(!service)throw new Error("Unknown service");const db=privateClientDb(),id=newId("case");db.exec("BEGIN IMMEDIATE");try{db.prepare("INSERT INTO private_client_cases(id,reference,service_id,owner_id) VALUES (?,?,?,?)").run(id,`DEMO-${id.slice(-8)}`,serviceId,actor);for(const title of service.checks)db.prepare("INSERT INTO private_client_checks(id,case_id,title) VALUES (?,?,?)").run(newId("check"),id,title);audit(actor,"private_client_case",id,"created dummy case");db.exec("COMMIT");return id;}catch(e){db.exec("ROLLBACK");throw e;}}
export type CaseRow={id:string;reference:string;service_id:string;stage:number;owner_id:string};
export function listCases(){return privateClientDb().prepare("SELECT * FROM private_client_cases ORDER BY created_at DESC,id").all() as CaseRow[];}
export function listChecks(){return privateClientDb().prepare("SELECT * FROM private_client_checks ORDER BY rowid").all() as {id:string;case_id:string;title:string;done:number}[];}
export function listExpiries(){return privateClientDb().prepare("SELECT e.*,c.reference FROM private_client_expiries e JOIN private_client_cases c ON c.id=e.case_id ORDER BY due_date").all() as {id:string;case_id:string;reference:string;kind:string;due_date:string}[];}
