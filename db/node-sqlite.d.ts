declare module 'node:sqlite' {
 export class DatabaseSync {
  constructor(path:string);
  exec(sql:string):void;
  prepare(sql:string):{ get(...values:(string|number|null)[]):unknown; run(...values:(string|number|null)[]):{changes:number|bigint} };
 }
}
