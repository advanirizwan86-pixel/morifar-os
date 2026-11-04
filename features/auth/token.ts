import type {SessionUser} from "./types";
const encoder=new TextEncoder(),decoder=new TextDecoder();
function secret(){const value=process.env.AUTH_SECRET;if(!value||value.length<32)throw new Error("AUTH_SECRET must contain at least 32 characters");return value}
const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
const decode=(value:string)=>Uint8Array.from(atob(value.replaceAll("-","+").replaceAll("_","/")),x=>x.charCodeAt(0));
async function key(){return crypto.subtle.importKey("raw",encoder.encode(secret()),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);}
export async function createToken(user:SessionUser){const payload=encode(encoder.encode(JSON.stringify({...user,exp:Date.now()+8*60*60*1000})));const signature=await crypto.subtle.sign("HMAC",await key(),encoder.encode(payload));return `${payload}.${encode(new Uint8Array(signature))}`;}
export async function verifyToken(token?:string):Promise<SessionUser|null>{if(!token||token.length>8192)return null;try{const parts=token.split(".");if(parts.length!==2)return null;const[payload,sig]=parts;if(!await crypto.subtle.verify("HMAC",await key(),decode(sig),encoder.encode(payload)))return null;const parsed=JSON.parse(decoder.decode(decode(payload))) as SessionUser&{exp:number};return typeof parsed.id==="string"&&typeof parsed.exp==="number"&&parsed.exp>Date.now()?parsed:null;}catch{return null;}}
