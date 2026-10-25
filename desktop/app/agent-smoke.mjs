// Headless acceptance driver. Separate invocations model closing and reopening
// the town; the background process is deliberately detached from this driver.
import {app,safeStorage,BrowserWindow} from 'electron';
import {readFile,writeFile} from 'node:fs/promises';
import {mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {agentPipe,requestAgent} from './agent-transport.mjs';

const base=process.env.MIRRORVILLE_AGENT_TEST_DIR;
if(!base||!path.isAbsolute(base))throw new Error('A dedicated QA directory is required');
const root=path.join(base,'background-agent'),stage=process.argv.at(-1);
mkdirSync(path.join(base,'driver'),{recursive:true});
app.setPath('userData',path.join(base,'driver'));
app.whenReady().then(async()=>{

const key=async()=>readFile(path.join(root,'key.hex'),'utf8');
const request=async(method,body={})=>requestAgent(agentPipe(root),await key(),method,body);
const scope='activity|ws://127.0.0.1:3000|mirrorville|'+'a'.repeat(64);
try{
 if(stage==='start'||stage==='restart'){
  const packaged=process.env.MIRRORVILLE_AGENT_TEST_EXE;
  const child=spawn(packaged||process.execPath,packaged?['--background-smoke']:[path.resolve('.'),'--background-smoke'],{cwd:path.resolve('.'),env:process.env,detached:true,windowsHide:true,stdio:'ignore'});child.on('error',()=>{});child.unref();
  let ready=false;
  for(let i=0;i<100;i++){try{await request('backgroundStatus');ready=true;break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}}
  if(!ready)throw new Error('Background did not start');
  const initial=await request('status');if(initial.enabled)throw new Error('QA should start paused');
  if(stage==='restart'){
    const current=await request('backgroundStatus');
    if(current.enabled||current.scope!==scope)throw new Error('Restart lost private configuration or resumed after explicit quit');
    await writeFile(path.join(base,'restart.json'),JSON.stringify({privateConfigRestored:true,explicitQuitStaysPaused:true}));
    await request('backgroundQuit');app.exit(0);return;
  }
  await request('backgroundConfigure',{scope,enabled:true,background:'测试用户正在开发一个桌面小镇项目，正在讨论采集、时段归纳和角色的近况材料。'});
  const status=await request('backgroundStatus');
  await writeFile(path.join(base,'driver-left.json'),JSON.stringify({processId:status.processId,driverProcess:process.pid,leftAt:Date.now(),windows:BrowserWindow.getAllWindows().length}));
 }else if(stage==='verify'){
  const left=JSON.parse(await readFile(path.join(base,'driver-left.json'),'utf8'));
  const state=await request('dailyReports',{scope}),status=await request('backgroundStatus');
  if(!state.reports.length||status.processId!==left.processId||state.reports[0].updated*1000<left.leftAt)throw new Error('No post-town-close summary');
  await writeFile(path.join(base,'acceptance.json'),JSON.stringify({synthetic:true,agentSurvivedClientExit:true,summaryAfterClientExit:true,driverWindows:left.windows,reports:state.reports,background:{busy:status.busy,enabled:status.enabled},noTownDelivery:state.deliveries.length===0},null,2));
 }else if(stage==='stop'){await request('backgroundQuit');}
 else throw new Error('Unknown QA stage');
}catch(error){await writeFile(path.join(base,'driver-error.txt'),error.message);process.exitCode=1;}
finally{app.exit(process.exitCode??0);}

}).catch(()=>app.exit(1));
