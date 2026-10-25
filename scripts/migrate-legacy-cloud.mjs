import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
// Explicit one-shot migration. Never print source rows, contacts, tokens or model keys.
if (!process.argv.includes('--execute')) throw new Error('Pass --execute to restore into the fresh cloud database');
const cli='C:/Users/1/tmp/mirrorville-cli-2.13/spacetimedb-cli.exe';
const source='http://127.0.0.1:3000/v1/database/mirrorville';
const target='https://maincloud.spacetimedb.com/v1/database/mirrorville-yw9299-worlds';
const env=Object.fromEntries(fs.readFileSync('D:/coding warehouse/cal-hack-proj/.env.local','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const login=spawnSync(cli,['login','show','--token'],{encoding:'utf8',windowsHide:true});
const cloudToken=login.stdout.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/)?.[0];
if (!cloudToken||!env.SPACETIMEDB_ADMIN_TOKEN) throw new Error('Publisher authentication unavailable');
async function sql(url,token,query){const r=await fetch(url+'/sql',{method:'POST',headers:{Authorization:'Bearer '+token},body:query});if(!r.ok)throw new Error('SQL failed '+r.status+' '+(await r.text()).slice(0,160));return r.json();}
async function call(name,args){const r=await fetch(target+'/call/'+name,{method:'POST',headers:{Authorization:'Bearer '+cloudToken,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!r.ok){const msg=await r.text();throw new Error('Restore call failed '+r.status+' '+msg.slice(0,180));}}
const defs=[['mirrors','mirror','mirror_storage'],['profiles','mirror_profile','mirror_profile'],['conversations','conversation','conversation_storage'],['lines','line','line_storage'],['relations','relation','relation'],['diaries','diary_entry','diary_entry'],['interests','interest','interest'],['cards','mirror_card','mirror_card'],['summaries','mirror_summary','mirror_summary'],['learning','mirror_learning','mirror_learning'],['styles','mirror_style','mirror_style'],['imports','import_status','import_status'],['encounters','encounter','encounter'],['messages','human_message','human_message'],['materials','conversation_material','conversation_material'],['budgets','activity_budget','activity_budget']];
const ast=ts.createSourceFile('index.ts',fs.readFileSync('spacetimedb/src/index.ts','utf8'),ts.ScriptTarget.Latest,true);
const columns={};
for(const statement of ast.statements) if(ts.isVariableStatement(statement)) for(const d of statement.declarationList.declarations){const init=d.initializer;if(!init||!ts.isCallExpression(init)||init.expression.getText(ast)!=='table')continue;const name=init.arguments[0].properties.find(p=>p.name?.getText(ast)==='name')?.initializer?.text;if(name)columns[name]=init.arguments[1].properties.map(p=>p.name.getText(ast));}
const [empty]=await sql(target,cloudToken,'SELECT COUNT(*) AS total FROM mirror_storage');
if(Number(empty.rows[0][0])!==0) throw new Error('Target is not empty; refusing to overwrite');
const snapshot=await Promise.all(defs.map(async ([,name])=>(await sql(source,env.SPACETIMEDB_ADMIN_TOKEN,'SELECT * FROM '+name))[0]));
if(snapshot.length!==defs.length)throw new Error('Incomplete snapshot');
const counts={},payload=defs.map(([label,sourceName,targetName],i)=>{
 const result=snapshot[i],names=result.schema.elements.map(e=>e.name.some); counts[label]=result.rows.length;
 return result.rows.map(row=>{
  const data=Object.fromEntries(names.map((n,j)=>[n,row[j]]));
  if(label==='mirrors')data.conversation_id=0;
  if(label==='conversations')data.active=false;
  if(label==='materials'&&!String(data.pair).startsWith('0:'))data.pair='0:'+data.pair;
  if(label==='imports'&&data.status==='processing')throw new Error('Wait for pending imports before migrating');
  return columns[targetName].map(field=>{const key=field.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());if(key==='world_id'&&data[key]===undefined)return 0;if(data[key]===undefined)throw new Error('Missing field '+targetName+'.'+key);return data[key];});
 });
});
const mirrorIds=payload[0].map(r=>String(r[0]));
if(!mirrorIds.includes('9'))throw new Error('Protected resident 9 missing from source');
await call('restore_legacy_snapshot',payload);
const [keys]=await sql(source,env.SPACETIMEDB_ADMIN_TOKEN,'SELECT deepseek_key, anthropic_key FROM config');
await call('set_llm_config',keys.rows[0]);
for(const [label,,name] of defs){const [r]=await sql(target,cloudToken,'SELECT COUNT(*) AS total FROM '+name);if(Number(r.rows[0][0])<counts[label])throw new Error('Count mismatch '+label);}
const [protectedRows]=await sql(target,cloudToken,'SELECT id FROM mirror_storage WHERE id = 9');
if(!protectedRows.rows.length)throw new Error('Protected resident not restored');
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/cloud-migration-counts.json',JSON.stringify({at:new Date().toISOString(),source:'local mirrorville',target:'mirrorville-yw9299-worlds',counts,protectedId9:true,activeConversationsClosed:true},null,2));
console.log(JSON.stringify({restored:true,counts,protectedId9:true,modelKeyConfigured:!!keys.rows[0][0]}));
