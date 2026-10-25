import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {build} from 'esbuild';
const host=process.env.MIRRORVILLE_TEST_HOST??'http://127.0.0.1:3011',database=process.env.MIRRORVILLE_TEST_DB??'mirrorville-demo-integrated';
if(!['localhost','127.0.0.1'].includes(new URL(host).hostname))throw Error('Only isolated local tests are allowed');
await build({entryPoints:['src/module_bindings/index.ts'],outfile:'.local-backend/demo-test-bindings.mjs',bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
const {DbConnection}=await import('../.local-backend/demo-test-bindings.mjs');
const clients=[];
async function connect(token){return new Promise((resolve,reject)=>{let b=DbConnection.builder().withUri(host).withDatabaseName(database).onConnect((conn,identity,newToken)=>{const c={conn,identity,token:newToken};clients.push(c);conn.subscriptionBuilder().onApplied(()=>resolve(c)).onError(reject).subscribe(['SELECT * FROM my_worlds','SELECT * FROM my_demo_settings','SELECT * FROM mirror','SELECT * FROM my_mirrors']);}).onConnectError((_,e)=>reject(e));if(token)b=b.withToken(token);b.build();});}
async function until(fn,limit=10000){const end=Date.now()+limit;while(!fn()){if(Date.now()>end)throw Error('Timed out');await new Promise(r=>setTimeout(r,100));}}
try{
 const a=await connect(),b=await connect(),inviteToken=randomBytes(32).toString('hex');
 await a.conn.reducers.createWorld({slot:1,name:'QA demo and guest lifecycle',description:'Synthetic local acceptance',allowStrangers:false,maxMembers:3,inviteToken});
 const world=[...a.conn.db.myWorlds.iter()].find(w=>w.isCurrent).id;
 await b.conn.reducers.joinWorld({slot:1,worldId:world,inviteToken});
 await a.conn.reducers.createMirror({name:'Demo Guest A',look:0,tipi:Array(10).fill(4),onMind:'',intent:''});
 await b.conn.reducers.createMirror({name:'Demo Guest B',look:1,tipi:Array(10).fill(4),onMind:'',intent:''});
 const guestId=[...a.conn.db.myMirrors.iter()][0].id;
 await assert.rejects(()=>b.conn.reducers.setDemoMode({enabled:true}));
 await a.conn.reducers.setDemoMode({enabled:true});
 await until(()=>[...b.conn.db.myDemoSettings.iter()][0]?.enabled);
 await a.conn.reducers.setDemoMode({enabled:false});
 await until(()=>![...b.conn.db.myDemoSettings.iter()][0]?.enabled);
 console.log('PASS: host-only real demo toggle replicates ON/OFF to another member');
 const second=await connect(a.token);a.conn.disconnect();
 await new Promise(r=>setTimeout(r,1500));
 assert.ok([...b.conn.db.visibleMirrors.iter()].some(m=>m.id===guestId&&m.active!==false));
 second.conn.disconnect();
 await until(()=>![...b.conn.db.visibleMirrors.iter()].some(m=>m.id===guestId&&m.active!==false),75000);
 console.log('PASS: guest stays while another tab is connected; last disconnect retires it after the grace period');
}finally{for(const c of clients)c.conn.disconnect();}
