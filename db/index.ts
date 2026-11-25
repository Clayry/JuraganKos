import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Client, InValue } from '@libsql/client';

const SCHEMA=[
 'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL)',
 'CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires)',
 'CREATE TABLE IF NOT EXISTS records (user_id TEXT PRIMARY KEY REFERENCES users(id), payload TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0)'
];

type SqlValue=string|number|null;
type RunResult={meta:{changes:number}};

const globals=globalThis as unknown as {
 juraganDatabase?: DatabaseSync;
 juraganDatabasePath?: string;
 juraganLibsql?: Client;
 juraganLibsqlUrl?: string;
 juraganSchemaReady?: Promise<void>;
};

function tursoUrl(){return process.env.TURSO_DATABASE_URL?.trim()||'';}

function localDatabase(){
 const file=resolve(process.env.DATABASE_PATH||join(process.cwd(),'data','juragankos.sqlite'));
 if(!globals.juraganDatabase||globals.juraganDatabasePath!==file){
  mkdirSync(dirname(file),{recursive:true});
  const sqlite=new DatabaseSync(file);
  sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  for(const sql of SCHEMA)sqlite.exec(sql);
  globals.juraganDatabase=sqlite;
  globals.juraganDatabasePath=file;
 }
 return globals.juraganDatabase;
}

async function tursoDatabase():Promise<Client>{
 const url=tursoUrl();
 if(!globals.juraganLibsql||globals.juraganLibsqlUrl!==url){
  const { createClient }=await import('@libsql/client');
  globals.juraganLibsql=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN?.trim()||undefined});
  globals.juraganLibsqlUrl=url;
  globals.juraganSchemaReady=undefined;
 }
 if(!globals.juraganSchemaReady){
  const client=globals.juraganLibsql;
  globals.juraganSchemaReady=client.batch(SCHEMA,'write').then(()=>undefined).catch(err=>{globals.juraganSchemaReady=undefined;throw err;});
 }
 await globals.juraganSchemaReady;
 return globals.juraganLibsql;
}

class Prepared {
 query:string;
 values:SqlValue[];
 constructor(query:string,values:SqlValue[]=[]){this.query=query;this.values=values;}
 bind(...values:SqlValue[]){return new Prepared(this.query,values);}
 async first<T>(){
  if(tursoUrl()){
   const client=await tursoDatabase();
   const res=await client.execute({sql:this.query,args:this.values as InValue[]});
   return (res.rows[0] as unknown as T)??undefined;
  }
  return localDatabase().prepare(this.query).get(...this.values) as T|undefined;
 }
 async run():Promise<RunResult>{
  if(tursoUrl()){
   const client=await tursoDatabase();
   const res=await client.execute({sql:this.query,args:this.values as InValue[]});
   return {meta:{changes:res.rowsAffected}};
  }
  const r=localDatabase().prepare(this.query).run(...this.values);
  return {meta:{changes:Number(r.changes)}};
 }
}

export const db={
 prepare:(sql:string)=>new Prepared(sql),
 async batch(statements:Prepared[]):Promise<RunResult[]>{
  if(tursoUrl()){
   const client=await tursoDatabase();
   const results=await client.batch(statements.map(s=>({sql:s.query,args:s.values as InValue[]})),'write');
   return results.map(r=>({meta:{changes:r.rowsAffected}}));
  }
  const sqlite=localDatabase();
  sqlite.exec('BEGIN IMMEDIATE');
  try{
   const results:RunResult[]=[];
   for(const s of statements){
    const r=sqlite.prepare(s.query).run(...s.values);
    results.push({meta:{changes:Number(r.changes)}});
   }
   sqlite.exec('COMMIT');
   return results;
  }catch(e){sqlite.exec('ROLLBACK');throw e;}
 }
};
