const assert=require('node:assert/strict');
const fs=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
const {DatabaseSync}=require('node:sqlite');
function load(file,dependencies={}){const m=new Module(file,module);m.filename=file;m.paths=module.paths;m.require=name=>name==='server-only'?{}:name in dependencies?dependencies[name]:require(name);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return m.exports;}
const policy=load('server/private-client/policy.ts');
assert.equal(policy.clientStages.length,7);assert.equal(policy.services.length,8);
assert.equal(new Set(policy.services.map(s=>s.id)).size,8);
for(const mode of [undefined,'dummy'])assert.doesNotThrow(()=>policy.assertDummyMode({MORIFAR_DATA_MODE:mode}));
for(const mode of ['live','production','DUMMY','dummy '])assert.throws(()=>policy.assertDummyMode({MORIFAR_DATA_MODE:mode}),/locked/);
const now=new Date('2026-11-04T20:30:00Z'); // already Nov 5 in UAE
assert.equal(policy.daysUntil('2026-11-05',now),0);
assert.equal(policy.daysUntil('2026-11-04',now),-1);
for(const date of ['2026-02-30','garbage','2026-13-01','2026-1-01'])assert.throws(()=>policy.daysUntil(date));
for(const [days,band] of [[-1,'Overdue'],[0,'30 days'],[30,'30 days'],[31,'60 days'],[60,'60 days'],[61,'90 days'],[90,'90 days'],[91,'Upcoming']])assert.equal(policy.expiryBand(days),band);
const db=new DatabaseSync(':memory:');db.exec("PRAGMA foreign_keys=ON; CREATE TABLE users(id TEXT PRIMARY KEY); INSERT INTO users VALUES ('executive'); CREATE TABLE audit_logs(id TEXT PRIMARY KEY, actor_type TEXT,actor_id TEXT REFERENCES users(id),entity_type TEXT,entity_id TEXT,action TEXT);");
let count=0;const repo=load('server/private-client/repository.ts',{'@/server/db':{getDb:()=>db,newId:prefix=>prefix+'_'+(++count)},'./policy':policy});
for(const s of policy.services){const id=repo.createCase('executive',s.id);assert.equal(repo.listChecks().filter(c=>c.case_id===id).length,s.checks.length);}
assert.equal(repo.listCases().length,8);
assert.equal(db.prepare('SELECT count(*) n FROM audit_logs').get().n,8);
assert.throws(()=>repo.createCase('executive','unknown'),/Unknown/);
assert.throws(()=>repo.createCase('invalid-actor','formation'));
assert.equal(repo.listCases().length,8,'failed creation must roll back');
assert.throws(()=>db.prepare("INSERT INTO private_client_expiries VALUES ('bad','nonexistent','Visa','2026-12-01')").run());
db.close();
console.log('PASS: dummy-mode lock, UAE date boundaries, expiry thresholds, all eight templates, persistent cases/checklists, audit writes and transaction rollback');
