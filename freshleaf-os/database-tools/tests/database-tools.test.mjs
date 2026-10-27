import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadConfig, validateTarget, toolsUri, findTools, withSecureConfig, backup, restore, listBackups, verifyBackup, assertTargetAbsent, runTool } from '../database-tools.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(HERE, '.tmp');
const config = { sourceDb:'freshleaf', uri:'mongodb+srv://demo:dummy%40password@cluster.example.invalid/other?retryWrites=true&authSource=admin' };
const tools = { mongodump:'fake-mongodump.exe', mongorestore:'fake-mongorestore.exe' };
async function fixture(t) {
  await fs.mkdir(TMP, {recursive:true});
  const base = await fs.mkdtemp(path.join(TMP,'test-'));
  t.after(async()=> { if (!path.resolve(base).startsWith(path.resolve(TMP)+path.sep)) throw new Error('Unsafe cleanup'); await fs.rm(base,{recursive:true,force:true}); });
  return base;
}
async function mockDump(_exe,args) {
  const directory = path.join(args[args.indexOf('--out')+1],'freshleaf');
  await fs.mkdir(directory,{recursive:true});
  await fs.writeFile(path.join(directory,'products.bson'),Buffer.from([5,0,0,0,0]));
  await fs.writeFile(path.join(directory,'products.metadata.json'),JSON.stringify({options:{},indexes:[{key:{_id:1},name:'_id_'}]}));
}
async function savedBackup(base) { return backup({base,config,tools,secure:(_uri,fn)=>fn('private-config.yml'),execute:mockDump,log:()=>{}}); }
const answers = values => async()=> values.shift() ?? '';

test('configuration precedence matches backend, DB_NAME overrides URI path',async t=>{
 const root=await fixture(t); await fs.mkdir(path.join(root,'backend/config'),{recursive:true});
 await fs.writeFile(path.join(root,'backend/config/db.ts'),"export const DB_NAME = 'freshleaf';");
 await fs.writeFile(path.join(root,'backend/.env'),'MONGODB_URI="mongodb://backend.invalid/wrong"\n');
 await fs.writeFile(path.join(root,'.env'),'MONGODB_URI=mongodb://root.invalid/another\n');
 assert.equal((await loadConfig(root,{})).uri,'mongodb://backend.invalid/wrong');
 assert.equal((await loadConfig(root,{MONGODB_URI:'mongodb://environment.invalid/another'})).uri,'mongodb://environment.invalid/another');
 assert.equal((await loadConfig(root,{})).sourceDb,'freshleaf');
});
test('missing configuration gives guidance and never guesses',async t=>{
 const root=await fixture(t); await fs.mkdir(path.join(root,'backend/config'),{recursive:true});
 await fs.writeFile(path.join(root,'backend/config/db.ts'),"export const DB_NAME = 'freshleaf';");
 await assert.rejects(loadConfig(root,{}),/Thieu MONGODB_URI/);
 await assert.rejects(loadConfig(root,{MONGODB_URI:''}),/Thieu MONGODB_URI/);
 await fs.writeFile(path.join(root,'backend/config/db.ts'),'export const DB_NAME = process.env.DB_NAME;');
 await assert.rejects(loadConfig(root,{}),/khong tu doan/);
});
test('missing tools and obsolete tools stop with install guidance',()=>{
 assert.throws(()=>findTools(()=>{throw new Error('missing');}),/Cai MongoDB Database Tools/);
 assert.throws(()=>findTools((exe)=>exe==='where.exe'?'C:\\tools\\mongodump.exe':'mongodump version: 100.2.0'),/100.3.0/);
});
test('bad URI errors never expose secret',async t=>{
 const root=await fixture(t); await fs.mkdir(path.join(root,'backend/config'),{recursive:true});
 await fs.writeFile(path.join(root,'backend/config/db.ts'),"export const DB_NAME = 'freshleaf';");
 await assert.rejects(loadConfig(root,{MONGODB_URI:'BAD_SECRET_PASSWORD'}),e=>!e.message.includes('BAD_SECRET_PASSWORD')&&e.message.includes('khong hop le'));
});
test('tools URI preserves implicit and explicit authSource, removes default DB',async()=>{
 const output=await toolsUri('mongodb://u:p@host/other?retryWrites=true'); assert.match(output,/authSource=other/); assert.ok(!output.includes('/other?'));
 assert.match(await toolsUri('mongodb://u:p@host/admin?authSource=custom'),/authSource=custom/);
 assert.equal(await toolsUri('mongodb://host/freshleaf'),'mongodb://host/');
 assert.match(await toolsUri('mongodb+srv://u:p@host/',async()=>[['authSource=admin']]),/authSource=admin/);
 assert.match(await toolsUri('mongodb+srv://u:p@host/other',async()=>[['authSource=admin']]),/authSource=admin/);
 await assert.rejects(toolsUri('mongodb+srv://u:p@host/other',async()=>{throw Object.assign(new Error('PRIVATE'),{code:'ETIMEOUT'});}),e=>e.message.includes('DNS')&&!e.message.includes('PRIVATE'));
});
test('only safe demo target names accepted; source/production and injection blocked',()=>{
 assert.equal(validateTarget('freshleaf_restore_demo','freshleaf'),'freshleaf_restore_demo');
 assert.equal(validateTarget('freshleaf_restore_demo_20261025_02','freshleaf'),'freshleaf_restore_demo_20261025_02');
 for(const name of ['freshleaf','FRESHLEAF','admin','production','demo','freshleaf_restore_demo;drop','freshleaf_restore_demo.*','../freshleaf','freshleaf_restore_demo_a b','freshleaf_restore_demo_'+ 'a'.repeat(70)]) assert.throws(()=>validateTarget(name,'freshleaf'));
 assert.throws(()=>validateTarget('freshleaf_restore_demo','freshleaf_restore_demo'));
});
test('no backups stops before any connection or tool launch',async t=>{
 const base=await fixture(t); assert.deepEqual(await listBackups(base),[]);
 await assert.rejects(restore({base,config,tools,ask:()=>{throw new Error('must not prompt');},absent:()=>{throw new Error('must not connect');}}),/Chua co backup/);
});
test('backup keeps metadata, uses mongodump, verifies manifest and never overwrites',async t=>{
 const base=await fixture(t); let argv; const logs=[];
 const first=await backup({base,config,tools,secure:(_uri,fn)=>fn('private-config.yml'),execute:async(exe,args)=>{assert.equal(exe,tools.mongodump);argv=args; await mockDump(exe,args);},log:s=>logs.push(s)});
 const second=await savedBackup(base); assert.notEqual(first,second);
 assert.ok(argv.includes('--db')); assert.equal(argv[argv.indexOf('--db')+1],'freshleaf');
 assert.ok(!JSON.stringify(argv).includes('dummy')); assert.ok(!logs.join().includes('dummy'));
 const manifest=await verifyBackup(first,'freshleaf'); assert.equal(manifest.complete,true); assert.equal(manifest.files.length,2);
 assert.equal((await listBackups(base)).length,2);
});
test('dump exit failure produces no successful backup manifest',async t=>{
 const base=await fixture(t); const logs=[];
 await assert.rejects(backup({base,config,tools,secure:(_uri,fn)=>fn('private'),execute:async()=>{throw new Error('URI_SECRET');},log:s=>logs.push(s)}),e=>!e.message.includes('URI_SECRET'));
 assert.ok(!logs.some(s=>s.includes('THANH CONG')));
 const names=await listBackups(base); await assert.rejects(verifyBackup(path.join(base,'backups',names[0]),'freshleaf'),/chua hoan tat/);
});
test('corrupt, missing metadata and wrong-source backups rejected',async t=>{
 const base=await fixture(t); const folder=await savedBackup(base);
 await assert.rejects(verifyBackup(folder,'other'),/nguon/);
 await fs.appendFile(path.join(folder,'dump/freshleaf/products.bson'),'corrupt');
 await assert.rejects(verifyBackup(folder,'freshleaf'),/SHA-256/);
 await fs.unlink(path.join(folder,'dump/freshleaf/products.metadata.json'));
 await assert.rejects(verifyBackup(folder,'freshleaf'),/metadata/);
 await assert.rejects(verifyBackup(path.join(base,'missing'),'freshleaf'),/khong ton tai/);
});
test('production target blocked before DB check',async t=>{
 const base=await fixture(t); await savedBackup(base); let called=false;
 await assert.rejects(restore({base,config,tools,ask:answers(['1','freshleaf']),absent:async()=>{called=true;},log:()=>{}}),/bi chan/); assert.equal(called,false);
});
test('existing target is rejected and failure to inspect fails closed',async()=>{
 class Existing {async connect(){} db(){return {command:async args=>{assert.equal(args.authorizedDatabases,false);return {databases:[{name:'freshleaf_restore_demo'}]};}};}async close(){}}
 await assert.rejects(assertTargetAbsent(config.uri,'freshleaf_restore_demo',Existing),/da ton tai/);
 class Denied extends Existing {db(){return {command:async()=>{throw new Error(config.uri);}};}}
 await assert.rejects(assertTargetAbsent(config.uri,'freshleaf_restore_demo',Denied),e=>e.message.includes('restore bi chan')&&!e.message.includes('dummy'));
});
test('cancelled restore performs no tool execution',async t=>{
 const base=await fixture(t); await savedBackup(base); let calls=0;
 await restore({base,config,tools,ask:answers(['1','','NO']),absent:async()=>{},execute:async()=>{calls++;},log:()=>{}});assert.equal(calls,0);
});
test('restore maps source namespaces only, never drops, checks absence twice',async t=>{
 const base=await fixture(t); await savedBackup(base); let checks=0; let argv;
 const target=await restore({base,config,tools,ask:answers(['1','','RESTORE freshleaf_restore_demo']),absent:async()=>{checks++;},secure:(_uri,fn)=>fn('private-config.yml'),execute:async(exe,args)=>{assert.equal(exe,tools.mongorestore);argv=args;},log:()=>{}});
 assert.equal(target,'freshleaf_restore_demo');assert.equal(checks,2);
 assert.equal(argv[argv.indexOf('--nsFrom')+1],'freshleaf.*');assert.equal(argv[argv.indexOf('--nsTo')+1],'freshleaf_restore_demo.*');
 assert.equal(argv[argv.indexOf('--nsInclude')+1],'freshleaf.*'); assert.ok(argv.includes('--stopOnError'));assert.ok(!argv.includes('--drop'));assert.ok(!JSON.stringify(argv).includes('dummy'));
 assert.deepEqual(await fs.readdir(path.join(base,'.locks')),[]);
});
test('target created during confirmation stops restore',async t=>{
 const base=await fixture(t);await savedBackup(base);let checks=0,executions=0;
 await assert.rejects(restore({base,config,tools,ask:answers(['1','','RESTORE freshleaf_restore_demo']),absent:async()=>{if(++checks===2)throw new Error('existing');},execute:async()=>{executions++;},log:()=>{}}),/Restore dung/); assert.equal(executions,0);
});
test('restore failure never reports success or retries the same target',async t=>{
 const base=await fixture(t);await savedBackup(base);const logs=[];
 await assert.rejects(restore({base,config,tools,ask:answers(['1','','RESTORE freshleaf_restore_demo']),absent:async()=>{},secure:(_uri,fn)=>fn('private'),execute:async()=>{throw new Error('SECRET');},log:s=>logs.push(s)}),e=>!e.message.includes('SECRET')&&e.message.includes('dang do'));
 assert.ok(!logs.some(s=>s.includes('RESTORE THANH CONG')));
});
test('secure config contains URI only inside protected temporary file and is cleaned',async()=>{
 let location;
 await withSecureConfig(config.uri,async file=>{location=file;const content=await fs.readFile(file,'utf8');assert.match(content,/^uri: "/);assert.ok(content.includes('dummy%40password'));if(process.platform==='win32'){const acl=execFileSync('icacls.exe',[path.dirname(file)],{encoding:'utf8',windowsHide:true});assert.ok(!acl.includes('(I)'));}});
 await assert.rejects(fs.stat(location),{code:'ENOENT'});
});
test('tool nonzero exit rejected, output containing secrets not forwarded',async()=>{
 await assert.rejects(runTool(process.execPath,['-e','console.error("PRIVATE_SECRET"); process.exit(7)']),e=>e.message.includes('exit 7')&&!e.message.includes('PRIVATE_SECRET'));
});
test('BAT wrappers work from directory containing spaces and preserve exit code',async t=>{
 const base=await fixture(t); const spaced=path.join(base,'tools with spaces'); await fs.mkdir(spaced);
 await fs.writeFile(path.join(spaced,'database-tools.mjs'),'console.log(process.argv[2]); process.exit(7);');
 for(const mode of ['backup','restore']){
  await fs.copyFile(path.join(HERE,'..',`${mode}.bat`),path.join(spaced,`${mode}.bat`));
  try{execFileSync('cmd.exe',['/d','/c',`${mode}.bat`],{cwd:spaced,stdio:'pipe',windowsHide:true});assert.fail('expected exit 7');}catch(error){assert.equal(error.status,7);assert.equal(error.stdout.toString().trim(),mode);}
 }
});

test('MongoDB Tools 100.19 prelude is accepted, hashed, and required to stay intact',async t=>{
 const base=await fixture(t);
 const folder=await backup({base,config,tools,secure:(_uri,fn)=>fn('private'),execute:async(exe,args)=>{
  await mockDump(exe,args);
  await fs.writeFile(path.join(args[args.indexOf('--out')+1],'freshleaf','prelude.json'),JSON.stringify({ServerVersion:'8.0.34',ToolVersion:'100.19.1'}));
 },log:()=>{}});
 const manifest=await verifyBackup(folder,'freshleaf');
 assert.equal(manifest.files.length,3);
 assert.ok(manifest.files.some(f=>f.name==='prelude.json'));
 await fs.writeFile(path.join(folder,'dump/freshleaf/prelude.json'),'{}');
 await assert.rejects(verifyBackup(folder,'freshleaf'),/prelude.json/);
});

test('unknown extra files still rejected with a useful safe backup error',async t=>{
 const base=await fixture(t);
 await assert.rejects(backup({base,config,tools,secure:(_uri,fn)=>fn('private'),execute:async(exe,args)=>{
  await mockDump(exe,args);await fs.writeFile(path.join(args[args.indexOf('--out')+1],'freshleaf','unexpected.json'),'{}');
 },log:()=>{}}),/Nguyen nhan: Dump chua tep/);
});
