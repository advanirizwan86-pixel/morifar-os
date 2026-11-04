import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
const base=process.env.MORIFAR_BASE_URL;
if(!base||!process.env.AUTH_SECRET||!process.env.MORIFAR_DATABASE_PATH)throw new Error('Use an isolated local dummy test server and database');
const db=new DatabaseSync(process.env.MORIFAR_DATABASE_PATH);
const admin=db.prepare("SELECT u.*,r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.email=?").get(process.env.MORIFAR_BOOTSTRAP_EMAIL);
assert(admin,'Run route smoke login first to bootstrap the isolated database');
function cookie(user){const payload=Buffer.from(JSON.stringify({...user,exp:Date.now()+60000})).toString('base64url');return 'morifar_session='+payload+'.'+createHmac('sha256',process.env.AUTH_SECRET).update(payload).digest('base64url');}
async function get(route,token){return fetch(base+route,{headers:token?{cookie:token}:{},redirect:'manual'});}
const adminCookie=cookie(admin);
for(const route of ['/private-client','/launch-readiness']){
 assert.equal((await get(route)).status,307);
 const r=await get(route,adminCookie);assert.equal(r.status,200);assert.match(await r.text(),/Live client data|live client data/);
}
let html=await (await get('/private-client',adminCookie)).text();
const form=html.match(/<form\b[^>]*>[\s\S]*?<\/form>/g).find(s=>s.includes('name="service"'));
assert(form,'Dummy case creation form must exist');
const actionName=form.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];assert(actionName);
const post=async(token)=>{const data=new FormData();data.set(actionName,'');data.set('service','relocation');data.set('dummy','yes');return fetch(base+'/private-client',{method:'POST',headers:{cookie:token},body:data,redirect:'manual'});};
const before=db.prepare('SELECT count(*) n FROM private_client_cases').get().n;
assert.equal((await post(adminCookie)).status,200);
assert.equal(db.prepare('SELECT count(*) n FROM private_client_cases').get().n,before+1);
const reviewerRole=db.prepare("SELECT id FROM roles WHERE name='CTO Reviewer'").get();assert(reviewerRole);
db.prepare("INSERT OR REPLACE INTO users(id,name,email,password_hash,role_id,avatar) VALUES ('synthetic-reviewer','Synthetic Reviewer','reviewer@example.invalid','not-a-login-password',?,'SR')").run(reviewerRole.id);
// Claims say Super Admin; DB role must take precedence for page/action permissions.
const forgedRoleCookie=cookie({...admin,id:'synthetic-reviewer',role:'Super Admin'});
assert.equal((await get('/private-client',forgedRoleCookie)).status,200);
const denied=await post(forgedRoleCookie);assert.equal(denied.status,500); // server action rejects before writing
assert.equal(db.prepare('SELECT count(*) n FROM private_client_cases').get().n,before+1);
db.prepare("UPDATE users SET status='inactive' WHERE id='synthetic-reviewer'").run();
const disabled=await get('/private-client',forgedRoleCookie);
if(disabled.status===307)assert.match(disabled.headers.get('location'),/login/);
else { const body=await disabled.text();assert.match(body,/NEXT_REDIRECT[\s\S]*login|http-equiv="refresh"[^>]*login/);assert(!body.includes('DEMO-'),'Disabled user must not receive case records'); }
db.close();console.log('PASS: protected new routes, persisted dummy creation, authoritative DB role, read-only reviewer rejection and disabled-session rejection');
