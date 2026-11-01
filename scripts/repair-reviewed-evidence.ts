/** Repair reviewed evidence text; optionally clear an explicitly pinned unsupported toll.
 * npx tsx scripts/repair-reviewed-evidence.ts --input scratch/quote-repairs.json [--apply]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config({path:'.env.local',quiet:true});
type Repair={id:string;field:'killed'|'injured'|'kidnapped'|'displaced'|'dateEvidence';expected:string;quote:string;evidenceFile:string;clearValue?:number};
const norm=(s:string)=>s.toLowerCase().replace(/&#\d+;|&\w+;/g,' ').replace(/[^\p{L}\p{N}]/gu,'');
async function main(){
 const i=process.argv.indexOf('--input');if(i<0)throw Error('--input required');const rows=JSON.parse(await fs.readFile(process.argv[i+1],'utf8')) as Repair[];
 if(!Array.isArray(rows)||!rows.length)throw Error('Expected repairs');
 await mongoose.connect(process.env.MONGODB_URI!,{serverSelectionTimeoutMS:15000});
 try{const attacks=mongoose.connection.db!.collection('attacks'),plans=[],seen=new Set();
 for(const r of rows){if(!mongoose.Types.ObjectId.isValid(r.id)||!['killed','injured','kidnapped','displaced','dateEvidence'].includes(r.field))throw Error('Invalid repair');
  const key=r.id+':'+r.field;if(seen.has(key))throw Error('Repeated field');seen.add(key);
  const source=JSON.parse(await fs.readFile(r.evidenceFile,'utf8'));
  if(r.quote.length<20||!norm(source.text).includes(norm(r.quote)))throw Error('Quote absent from evidence');
  const doc=await attacks.findOne({_id:new mongoose.Types.ObjectId(r.id),_deleted:{$ne:true}});
  if(!doc||!doc.sources.some((s:{url:string})=>s.url.replace(/\/$/,'')===source.url.replace(/\/$/,'')))throw Error('Source is not attached to active record');
  if(r.clearValue!==undefined&&(r.field==='dateEvidence'||!Number.isInteger(r.clearValue)||r.clearValue<1))throw Error('Invalid unsupported toll');
  if(r.field!=='dateEvidence'&&doc.casualties?.[r.field]==null&&!(r.clearValue!==undefined&&doc.casualtyMeta?.[r.field]?.sourceText===r.quote))throw Error('No recorded toll to annotate');
  if(r.clearValue!==undefined&&doc.casualties?.[r.field]!==r.clearValue&&doc.casualties?.[r.field]!==null)throw Error('Recorded toll changed');
  const field=r.field==='dateEvidence'?'dateEvidence':`casualtyMeta.${r.field}.sourceText`;
  const actual=r.field==='dateEvidence'?doc.dateEvidence:doc.casualtyMeta?.[r.field]?.sourceText;
  if(actual!==r.expected&&actual!==r.quote)throw Error('Evidence changed since inspection');
  plans.push({r,doc,field,skip:actual===r.quote});
 }
 const out=path.resolve('scratch/review-evidence-repairs',`run-${new Date().toISOString().replace(/[:.]/g,'-')}`);await fs.mkdir(out,{recursive:true});
 await fs.writeFile(path.join(out,'before.json'),JSON.stringify(plans,null,2));let changed=0;
 if(process.argv.includes('--apply'))for(const p of plans){if(p.skip)continue;const guard:Record<string,unknown>={_id:p.doc._id,_deleted:{$ne:true},[p.field]:p.r.expected};const set:Record<string,unknown>={[p.field]:p.r.quote,updatedAt:new Date()};
  if(p.r.clearValue!==undefined){guard[`casualties.${p.r.field}`]=p.r.clearValue;set[`casualties.${p.r.field}`]=null;set[`casualtyMeta.${p.r.field}`]={precision:'unknown',min:null,max:null,estimate:null,sourceText:p.r.quote};delete set[p.field];}
  const result=await attacks.updateOne(guard,{$set:set});if(result.modifiedCount!==1)throw Error('Concurrent evidence change');changed++;}
 const summary={apply:process.argv.includes('--apply'),planned:plans.length,changed,artifact:out};await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
 }finally{await mongoose.disconnect()}
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
