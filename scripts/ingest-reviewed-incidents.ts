/** Publish reviewed, source-grounded candidates through the real ingestion gates.
 * --input scratch/reviewed-candidates.json [--apply]. Every candidate must cite
 * a saved fetched article and literal evidence. Dry run never invokes ingestion.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import type { RawAttackData } from '../src/lib/free-news';
import { normalizeIncidentDate } from '../src/lib/incident-date';
import { CANONICAL_NIGERIA_JURISDICTIONS } from '../src/lib/incident-audit-contract';
dotenv.config({path:'.env.local',quiet:true});
type Reviewed = {candidate:RawAttackData; evidenceFile:string; quotes:string[]; note:string};
const normalized=(s:string)=>s.toLowerCase().replace(/&#\d+;|&\w+;/g,' ').replace(/[^\p{L}\p{N}]/gu,'');
async function main(){
 const i=process.argv.indexOf('--input');if(i<0)throw Error('--input required');const input=process.argv[i+1];const rows=JSON.parse(await fs.readFile(input,'utf8')) as Reviewed[];
 if(!Array.isArray(rows)||!rows.length)throw Error('Expected reviewed candidate list');
 for(const r of rows){const c=r.candidate;const source=JSON.parse(await fs.readFile(r.evidenceFile,'utf8')) as {text:string,url:string};
  if(!source.text||!r.quotes.length||r.quotes.some(q=>q.length<15||!normalized(source.text).includes(normalized(q))))throw Error(`Missing literal evidence: ${c.title}`);
  if(!c.sources.some(s=>s.url.replace(/\/$/,'')===source.url.replace(/\/$/,'')))throw Error('Candidate source does not match evidence file');
  if(!normalizeIncidentDate(c)||!CANONICAL_NIGERIA_JURISDICTIONS.some(s=>s===c.location.state))throw Error('Invalid event date/state');
  if(!r.note||r.note.length<40)throw Error('A reviewed event decision is required');
  for(const v of Object.values(c.casualties))if(v!==null&&(!Number.isInteger(v)||v<0))throw Error('Invalid victim count');
 }
 if(!process.env.MONGODB_URI)throw Error('MONGODB_URI required');await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
 try{const db=mongoose.connection.db!;const out=path.resolve('scratch','reviewed-ingest',`run-${new Date().toISOString().replace(/[:.]/g,'-')}`);await fs.mkdir(out,{recursive:true});
 await fs.writeFile(path.join(out,'input.json'),JSON.stringify(rows,null,2));
 for(const n of ['attacks','incident_reviews'])await fs.writeFile(path.join(out,`${n}-before.json`),JSON.stringify(await db.collection(n).find({}).toArray(),null,2));
 const {ingestSearchLedAttacks,hashFor}=await import('../src/lib/search-led-discovery');
 const {default:Attack}=await import('../src/lib/models/Attack');
 // Validate the whole batch before ingestion can write any of it.
 for(const r of rows){const c=r.candidate;const date=normalizeIncidentDate(c)!;
  await new Attack({...c,date:date.date,datePrecision:date.datePrecision,dateRange:date.dateRange,hash:hashFor(c)}).validate();
 }
 const apply=process.argv.includes('--apply');const result=apply?await ingestSearchLedAttacks(rows.map(r=>r.candidate),'ReviewedQueue'):null;
 const records=[];for(const r of rows){const hash=hashFor(r.candidate);const found=await db.collection('attacks').findOne({hash,_deleted:{$ne:true}});records.push({title:r.candidate.title,id:found?String(found._id):null});}
 const summary={apply,result,records,artifact:out};await fs.writeFile(path.join(out,'result.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));if(result?.errors)process.exitCode=1;
 }finally{await mongoose.disconnect();}
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
