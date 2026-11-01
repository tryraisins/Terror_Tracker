/** Apply explicitly reviewed queue dispositions. No incident identities or tolls are changed.
 * npx tsx scripts/apply-review-decisions.ts --input scratch/decisions.json [--apply]
 * Each decision pins the complete review snapshot, quotes its evidence, and names
 * active records when resolving captured events or dismissing a distinct stored pair.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config({path:'.env.local',quiet:true});

type Decision = {
  reviewId: string;
  fingerprint: string;
  outcome: 'recorded' | 'excluded' | 'distinct_stored_events';
  note: string;
  recordIds: string[];
  evidence: Array<{url:string; quote:string}>;
};
function stable(v: unknown): string {
  if(v===null || typeof v!=='object') return JSON.stringify(v);
  if(v instanceof Date)return JSON.stringify(v.toISOString());
  if(v instanceof mongoose.Types.ObjectId)return JSON.stringify(v.toHexString());
  if(Array.isArray(v))return `[${v.map(stable).join(',')}]`;
  return `{${Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>`${JSON.stringify(k)}:${stable(x)}`).join(',')}}`;
}
function fingerprint(v: unknown){return crypto.createHash('sha256').update(stable(v)).digest('hex');}
function arg(name:string){const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];}
async function main(){
 const input=arg('--input');if(!input)throw Error('--input is required');
 const decisions=JSON.parse(await fs.readFile(input,'utf8')) as Decision[];
 if(!Array.isArray(decisions)||!decisions.length)throw Error('Expected a nonempty decision list');
 const ids=new Set<string>();
 for(const d of decisions){
  if(!/^[a-f0-9]{24}$/.test(d.reviewId)||ids.has(d.reviewId))throw Error('Invalid or repeated review ID');ids.add(d.reviewId);
  if(!/^[a-f0-9]{64}$/.test(d.fingerprint))throw Error('Missing review fingerprint');
  if(!['recorded','excluded','distinct_stored_events'].includes(d.outcome))throw Error('Invalid outcome');
  if(typeof d.note!=='string'||d.note.trim().length<60||d.note.length>1800)throw Error('Each decision needs a specific disposition note');
  if(!Array.isArray(d.evidence)||!d.evidence.length||d.evidence.some(e=>!/^https?:\/\//.test(e.url)||!e.quote||e.quote.length<20))throw Error('Each decision needs source evidence');
  if(!Array.isArray(d.recordIds)||d.recordIds.some(id=>!/^[a-f0-9]{24}$/.test(id)))throw Error('Invalid record IDs');
  if(d.outcome==='recorded'&&!d.recordIds.length)throw Error('Recorded outcome requires active incident IDs');
  if(d.outcome==='distinct_stored_events'&&new Set(d.recordIds).size<2)throw Error('Distinct-pair disposition requires both stored incidents');
 }
 if(!process.env.MONGODB_URI)throw Error('MONGODB_URI is required');
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
 try{
  const db=mongoose.connection.db!;const reviews=db.collection('incident_reviews');const attacks=db.collection('attacks');
  const plans=[];
  for(const d of decisions){
   const row=await reviews.findOne({_id:new mongoose.Types.ObjectId(d.reviewId)});if(!row)throw Error(`Review missing: ${d.reviewId}`);
   const status=d.outcome==='recorded'?'resolved':'dismissed';
   const note=`${d.outcome==='recorded'?'Same event already recorded':d.outcome==='distinct_stored_events'?'Distinct events':'Excluded after source review'}: ${d.note}${d.recordIds.length?' Records: '+d.recordIds.join(', '):''}`;
   if(note.length>2000)throw Error('Disposition note exceeds maximum length');
   if(row.status===status&&row.dispositionNote===note){plans.push({d,row,note,status,skip:true});continue;}
   if(row.status!=='pending'||fingerprint(row)!==d.fingerprint)throw Error(`Review changed since inspection: ${d.reviewId}`);
   if(d.outcome==='excluded'&&row.kind==='duplicate')throw Error('Duplicate rows need a recorded or distinct-stored-events decision; promote unrecorded events first');
   for(const id of d.recordIds)if(!await attacks.findOne({_id:new mongoose.Types.ObjectId(id),_deleted:{$ne:true}}))throw Error(`Referenced incident is not active: ${id}`);
   plans.push({d,row,note,status,skip:false});
  }
  const apply=process.argv.includes('--apply');const out=path.resolve('scratch','review-dispositions',`run-${new Date().toISOString().replace(/[:.]/g,'-')}`);await fs.mkdir(out,{recursive:true});
  await fs.writeFile(path.join(out,'decisions.json'),JSON.stringify(decisions,null,2));
  await fs.writeFile(path.join(out,'reviews-before.json'),JSON.stringify(await reviews.find({}).toArray(),null,2));
  await fs.writeFile(path.join(out,'attacks-before.json'),JSON.stringify(await attacks.find({}).toArray(),null,2));
  let modified=0,skipped=0;
  for(const p of plans){if(p.skip){skipped++;continue;}if(!apply)continue;
   const now=new Date();const filter={_id:p.row._id,status:'pending',updatedAt:p.row.updatedAt};
   const r=await reviews.updateOne(filter,{$set:{status:p.status,reviewedAt:now,reviewedBy:'evidence-reviewed-manifest',dispositionNote:p.note,retryable:false,nextRetryAt:null,updatedAt:now}});
   if(r.modifiedCount!==1)throw Error(`Concurrent change prevented disposition: ${p.d.reviewId}`);modified++;
   await fs.appendFile(path.join(out,'applied.jsonl'),JSON.stringify({reviewId:p.d.reviewId,status:p.status,note:p.note})+'\n');
  }
  const pending=await reviews.countDocuments({status:'pending'});
  const summary={apply,planned:plans.length,modified,skipped,pending,artifact:out};await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
 }finally{await mongoose.disconnect();}
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
