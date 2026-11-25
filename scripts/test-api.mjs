import ts from 'typescript';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'juragankos-test-'));
process.env.DATABASE_PATH=join(dir,'test.sqlite');
for(const [source,dest] of [['lib/kos.ts','lib/kos.mjs'],['db/index.ts','db/index.mjs'],['app/api/manage/route.ts','app/api/manage/route.mjs']]){
 let code=readFileSync(source,'utf8').replace("from '../../../db'","from '../../../db/index.mjs'").replace("from '../../../lib/kos'","from '../../../lib/kos.mjs'");
 const out=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 mkdirSync(join(dir,dest,'..'),{recursive:true});writeFileSync(join(dir,dest),out);
}
const {GET,POST}=await import(pathToFileURL(join(dir,'app/api/manage/route.mjs')));
const url='http://localhost:3000/api/manage';
async function post(action,values={},cookie='',version=0,origin='http://localhost:3000',host='localhost:3000'){
 return POST(new Request(url,{method:'POST',headers:{'content-type':'application/json',origin,cookie,host},body:JSON.stringify({action,values,version})}));
}
const get=async(cookie='')=>(await GET(new Request(url,{headers:{cookie}}))).json();
try{
 assert.equal((await get()).user,null);
 const signup=await post('register',{name:'Pemilik Uji',email:'test@example.com',password:'testing12345'});assert.equal(signup.status,200);
 // Emulate Next.js internal URL differing from the browser's real Host.
 const aliasLogin=await post('login',{email:'test@example.com',password:'testing12345'},'',0,'http://127.0.0.1:3000','127.0.0.1:3000');
 assert.equal(aliasLogin.status,200,'Browser Host must work even when req.url uses localhost');
 const proxyLogin=await post('login',{email:'test@example.com',password:'testing12345'},'',0,'https://kos.example','kos.example');
 assert.equal(proxyLogin.status,200,'Public Host must work behind a proxy');
 assert.ok(proxyLogin.headers.get('set-cookie').includes('; Secure'));
 assert.equal((await post('login',{},'',0,'http://127.0.0.1:4000','127.0.0.1:3000')).status,403,'Mismatched ports must be rejected');
 assert.equal((await post('login',{},'',0,'null')).status,403,'Opaque origins must be rejected');
 assert.equal((await post('login',{},'',0,'http://localhost:3000@evil.example')).status,403,'Spoofed origins must be rejected');
 const cookie=signup.headers.get('set-cookie').split(';')[0];assert.ok(signup.headers.get('set-cookie').includes('HttpOnly'));
 let data=await get(cookie);assert.equal(data.state.rooms.length,0);
 assert.equal((await post('room',{number:'C01',type:'Standard',price:1000000,floor:'1'},cookie,data.version)).status,200);
 data=await get(cookie);const roomId=data.state.rooms[0].id;
 assert.equal((await post('room',{number:'C02',price:1000000},cookie,0)).status,409);
 const date=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'}),month=date.slice(0,7);
 assert.equal((await post('tenant',{name:'Penghuni Uji',phone:'08123456789',roomId,start:date},cookie,data.version)).status,200);
 data=await get(cookie);const tenantId=data.state.tenants[0].id;
 assert.equal((await post('payment',{tenantId,month,date,amount:400000,method:'Tunai'},cookie,data.version)).status,200);
 data=await get(cookie);assert.equal(data.state.payments[0].amount,400000);
 assert.equal((await post('checkout',{id:tenantId},cookie,data.version)).status,400);
 assert.equal((await post('room',{number:'evil',price:1},cookie,data.version,'https://evil.example')).status,403);
 assert.equal((await post('room',{number:'unauthorized',price:1})).status,401);
 assert.equal((await post('login',{email:'test@example.com',password:'incorrect-password'})).status,401);
 const login=await post('login',{email:'test@example.com',password:'testing12345'});assert.equal(login.status,200);
 const secondCookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await get(secondCookie)).state.payments.length,1);
 const secondAccount=await post('register',{name:'Lain',email:'other@example.com',password:'testing54321'});assert.equal((await get(secondAccount.headers.get('set-cookie').split(';')[0])).state.rooms.length,0);
 await post('logout',{},cookie);assert.equal((await get(cookie)).user,null);
 const demo=await post('demo');assert.equal(demo.status,200);
 const demoCookie=demo.headers.get('set-cookie').split(';')[0];
 const demoData=await get(demoCookie);assert.equal(demoData.state.rooms.length,20);
 const {db}=await import(pathToFileURL(join(dir,'db/index.mjs')));
 await db.prepare("UPDATE sessions SET expires=1 WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.juragankos.local')").run();
 const demo2=await post('demo');assert.equal(demo2.status,200);
 const expiredCount=await db.prepare("SELECT COUNT(*) AS count FROM users WHERE email LIKE '%@demo.juragankos.local'").first();
 assert.equal(expiredCount.count,1,'Expired demo accounts must be pruned when creating a new demo session');
 console.log('PASS: registration, login, persistent rooms/tenants/payments, partial payments, checkout validation, optimistic concurrency, CSRF, browser Host aliases, proxy HTTPS cookies, unauthorized requests, account isolation, logout, demo pruning.');
}finally{rmSync(dir,{recursive:true,force:true});}
