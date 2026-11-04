import "server-only";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {mkdir,writeFile,readFile,unlink,mkdtemp,rm,realpath} from "node:fs/promises";
import {join,resolve,sep} from "node:path";
import {tmpdir} from "node:os";
import {seal,open,dataKey} from "./crypto";
const execute=promisify(execFile);
export const maxPhotoBytes=8*1024*1024;
export function photoMime(bytes:Buffer){if(bytes.length<12||bytes.length>maxPhotoBytes)throw new Error("Photo must be JPEG or PNG and at most 8 MB");if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return "image/png";if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217)return "image/jpeg";throw new Error("Only JPEG or PNG photos are accepted");}
async function storageRoot(){const configured=process.env.MORIFAR_FILE_ROOT;if(!configured||!configured.startsWith("/"))throw new Error("Configure an absolute private MORIFAR_FILE_ROOT outside the application public directory");const root=resolve(configured);if(root===resolve(process.cwd())||root.startsWith(resolve(process.cwd(),"public")+sep)||root===resolve(process.cwd(),"public"))throw new Error("Private file storage cannot use a public directory");await mkdir(root,{recursive:true,mode:0o700});const actual=await realpath(root);if(actual===resolve(process.cwd(),"public")||actual.startsWith(resolve(process.cwd(),"public")+sep))throw new Error("Public storage symlink is forbidden");return actual;}
function safeId(id:string){if(!/^photo_[a-f0-9]{16}$/.test(id))throw new Error("Invalid object id");return id;}
export async function savePhoto(id:string,bytes:Buffer){safeId(id);photoMime(bytes);dataKey();const root=await storageRoot();const scanner=process.env.MORIFAR_CLAMSCAN_PATH;if(!scanner||!scanner.startsWith("/"))throw new Error("Uploads are locked until an absolute malware-scanner path is configured");
 const temporary=await mkdtemp(join(tmpdir(),"morifar-scan-"));try{const scanFile=join(temporary,"photo");await writeFile(scanFile,bytes,{mode:0o600,flag:"wx"});try{await execute(scanner,["--no-summary",scanFile],{timeout:30000,maxBuffer:65536});}catch{throw new Error("Photo rejected: malware detected or scanner unavailable");}
 await writeFile(join(root,`${id}.bin`),seal(bytes,undefined,`photo:${id}`),{mode:0o600,flag:"wx"});}finally{await rm(temporary,{recursive:true,force:true});}}
export async function readPhoto(id:string){return open(await readFile(join(await storageRoot(),`${safeId(id)}.bin`)),undefined,`photo:${id}`);}
export async function removePhoto(id:string){await unlink(join(await storageRoot(),`${safeId(id)}.bin`));}
