import type {SessionUser} from "./types";
const encoder=new TextEncoder();
function secret(){const value=process.env.AUTH_SECRET;if(!value||value.length<32)throw new Error("AUTH_SECRET must contain at least 32 characters");return value}
const encode=(value:string)=>btoa(value).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
const decode=(value:string)=>atob(value.replaceAll("-","+").replaceAll("_","/"));
async function signature(value:string){const key=await crypto.subtle.importKey("raw",encoder.encode(secret()),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(value)))))}
export async function createToken(user:SessionUser){const payload=encode(JSON.stringify({...user,exp:Date.now()+8*60*60*1000}));return `${payload}.${await signature(payload)}`}
export async function verifyToken(token?:string):Promise<SessionUser|null>{if(!token)return null;try{const [payload,sig]=token.split(".");if(!payload||sig!==await signature(payload))return null;const parsed=JSON.parse(decode(payload)) as SessionUser&{exp:number};return parsed.exp>Date.now()?parsed:null}catch{return null}}
