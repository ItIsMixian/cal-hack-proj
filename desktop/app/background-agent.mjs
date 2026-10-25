import {app,Menu,Tray,nativeImage,safeStorage} from 'electron';
import {mkdir,readFile,writeFile,rename,lstat,realpath} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ObserverClient} from './observer-client.mjs';
import {ReportEngine} from './report-engine.mjs';
import {agentPipe,serveAgent} from './agent-transport.mjs';
import {validOperation} from './policy.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
export async function startBackgroundAgent(base,{smoke=false}={}){
  const root=path.join(base,'background-agent');await mkdir(root,{recursive:true,mode:0o700});
  const actualRoot=await realpath(root),actualBase=await realpath(base);
  if((await lstat(root)).isSymbolicLink()||!actualRoot.toLowerCase().startsWith(actualBase.toLowerCase()+path.sep))throw new Error('Invalid background directory');
  if(process.platform==='win32'){
    const account=[process.env.USERDOMAIN,process.env.USERNAME].filter(Boolean).join('\\');
    const acl=spawnSync('icacls',[root,'/inheritance:r','/grant:r',account+':(OI)(CI)F','*S-1-5-18:(OI)(CI)F','*S-1-5-32-544:(OI)(CI)F'],{windowsHide:true,stdio:'ignore'});
    if(acl.status!==0)throw new Error('Could not protect background directory');
  }
  app.setPath('userData',root);
  if(!app.requestSingleInstanceLock()){app.quit();return;}
  app.on('window-all-closed',()=>{}); // This process intentionally never creates a window.
  await app.whenReady();
  if(!safeStorage.isEncryptionAvailable()){app.exit(1);return;}
  const readSecret=async name=>{try{return JSON.parse(safeStorage.decryptString(await readFile(path.join(root,name))));}catch{return null;}};
  let writes=Promise.resolve();
  const saveSecret=(name,value)=>{
    const bytes=safeStorage.encryptString(JSON.stringify(value));
    writes=writes.catch(()=>{}).then(async()=>{const target=path.join(root,name);await writeFile(target+'.tmp',bytes,{mode:0o600});await rename(target+'.tmp',target);});return writes;
  };
  // Electron safeStorage master keys are profile-specific. Share only this random
  // local IPC capability under the owner-only directory ACL; model credentials
  // and settings remain encrypted inside the agent's own Electron profile.
  let key;try{key=await readFile(path.join(root,'key.hex'),'utf8');}catch{}
  if(typeof key!=='string'||!/^[a-f0-9]{64}$/.test(key)){key=randomBytes(32).toString('hex');await writeFile(path.join(root,'key.hex'),key,{mode:0o600});}
  const disk=await readSecret('state.bin')??{config:{}};
  if(!disk.config||typeof disk.config!=='object')disk.config={};
  const command=app.isPackaged?path.join(process.resourcesPath,'observer','mirrorville-observer.exe'):(process.env.MIRRORVILLE_PYTHON||'python');
  const args=app.isPackaged?['--data-dir',path.join(base,'observer')]:[path.join(here,'../native_host.py'),'--data-dir',path.join(base,'observer')];
  if(smoke)args.push('--test-no-sampling');
  let unavailable=false,tray,server,timer,stopping=false,engine;
  const observer=new ObserverClient(command,args,()=>{unavailable=true;engine?.invalidate();refreshTray();});
  const publicConfig=JSON.parse(await readFile(path.join(here,'runtime-config.json'),'utf8'));
  // A local-server guest token cannot authenticate against Maincloud.
  const modelScope=publicConfig.endpoint+'|'+publicConfig.database;
  if(disk.modelScope!==modelScope){disk.modelToken=undefined;disk.modelScope=modelScope;}
  if(disk.config.scope&&!disk.config.scope.startsWith('activity|'+modelScope+'|'))
    disk.config={...disk.config,enabled:false,capture:{...disk.config.capture,enabled:false}};
  await saveSecret('state.bin',disk);
  const {createModelClient}=createRequire(import.meta.url)('./model-client.cjs');
  const model=createModelClient({endpoint:publicConfig.endpoint,database:publicConfig.database,loadToken:async()=>disk.modelToken,saveToken:async token=>{disk.modelToken=token;await saveSecret('state.bin',disk);}});
  engine=new ReportEngine({observer,summarize:args=>model.summarize(args),config:disk.config,persist:async config=>{disk.config=config;await saveSecret('state.bin',disk);}});
  let status=await observer.request('status');
  const nativeCapture=async enabled=>{
    const before=await observer.request('status');
    await observer.request('capture',{enabled,browserTopics:before.browserTopics===true,contextTitles:true});
    await engine.configure({capture:{enabled,browserTopics:before.browserTopics===true,contextTitles:true}});
    status=await observer.request('status');refreshTray();
  };
  const configure=async body=>{
    if(!body.scope.startsWith(`activity|${publicConfig.endpoint}|${publicConfig.database}|`))throw new Error('Wrong database scope');
    const first=!engine.config.scope;
    // Invalidate old-owner/model work before switching the active local scope.
    engine.invalidate();
    if(!body.enabled)await observer.request('pause');
    await engine.configure({scope:body.scope,enabled:body.enabled,capture:{...engine.config.capture,enabled:body.enabled},mirrorId:body.mirrorId??'',background:body.background??(engine.config.scope===body.scope?engine.config.background??'':'')});
    if(first&&body.enabled&&!smoke)await observer.request('codexAuto',{enabled:true});
    await nativeCapture(body.enabled);
    if(body.enabled)void engine.run().then(refreshTray);
    return engine.status();
  };
  function openTown(){
    const townArgs=app.isPackaged?[]:[path.resolve(here,'../..')];
    // This path is only reached by an explicit tray click to show the town.
    const child=spawn(process.execPath,townArgs,{detached:true,windowsHide:false,stdio:'ignore'});child.on('error',()=>{});child.unref();
  }
  async function quitAll(){
    if(stopping)return;stopping=true;
    try{await engine.configure({enabled:false,capture:{...engine.config.capture,enabled:false}});await observer.request('pause');}catch{}
    app.quit();
  }
  function refreshTray(){
    if(!tray)return;
    const label=unavailable?'Observation disconnected':status.enabled?(engine.busy?'Summarizing recent activity':'Observing recent activity'):'Observation paused';
    tray.setToolTip('Mirrorville · '+label);
    tray.setContextMenu(Menu.buildFromTemplate([
      {label:'Return to town',click:openTown},{label,enabled:false},
      {label:status.enabled?'Pause observation':'Resume observation',enabled:!!engine.config.scope&&!unavailable,click:()=>{void configure({...engine.config,enabled:!status.enabled}).catch(()=>{});}},
      {type:'separator'},{label:'Quit observation',click:()=>{void quitAll();}},
    ]));
  }
  const startup=()=>smoke?false:app.getLoginItemSettings({path:process.execPath,args:['--background-agent']}).openAtLogin;
  const extendedStatus=()=>({...engine.status(),captureEnabled:status.enabled,browserTopics:status.browserTopics===true,available:!unavailable,startup:startup(),processId:process.pid});
  server=await serveAgent(agentPipe(root),key,validOperation,async(method,body)=>{
    if(method==='backgroundStatus')return extendedStatus();
    if(method==='backgroundConfigure')return configure(body);
    if(method==='backgroundRun'){
      if(body.scope!==engine.config.scope)throw new Error('Wrong local scope');
      void engine.run(true).then(refreshTray);return {scheduled:true};
    }
    if(method==='backgroundStartup'){
      if(smoke)throw new Error('Startup disabled in smoke test');
      app.setLoginItemSettings({name:'Mirrorville',openAtLogin:body.enabled,path:process.execPath,args:['--background-agent']});
      return {enabled:startup()};
    }
    if(method==='backgroundQuit'){setTimeout(()=>{void quitAll();},20);return {stopping:true};}
    if(['pause','clear','capture','codexAuto'].includes(method))engine.invalidate();
    const value=await observer.request(method,body);
    if(method==='pause'||method==='clear')await engine.configure({...(method==='clear'?{enabled:false,scope:'',mirrorId:'',background:''}:{}),capture:{...engine.config.capture,enabled:false}});
    if(method==='clear')engine.skipped={};
    if(method==='capture')await engine.configure({capture:{enabled:body.enabled,browserTopics:body.browserTopics,contextTitles:body.contextTitles===true}});
    status=await observer.request('status');refreshTray();
    return method==='dailyReports'?{...value,background:extendedStatus()}:value;
  });
  if(!smoke){tray=new Tray(nativeImage.createFromPath(path.join(here,'icon.png')));tray.on('double-click',openTown);}
  // Existing consent belongs to the background service, not the town window.
  if(engine.config.capture){
    await observer.request('capture',{...engine.config.capture,enabled:engine.config.enabled===true&&engine.config.capture.enabled===true});status=await observer.request('status');
  }
  refreshTray();
  const tick=async()=>{
    if(stopping||unavailable)return;
    try{
      status=await observer.request('status');
      // Renew the native transport's 12-hour lease only while persistent background
      // capture is enabled. Explicit pause/clear writes that flag false.
      if(!status.enabled&&status.sampleState!=='error'&&engine.config.capture?.enabled){await observer.request('capture',engine.config.capture);status=await observer.request('status');}
      void engine.run().then(refreshTray);refreshTray();
    }catch{unavailable=true;refreshTray();}
  };
  timer=setInterval(()=>{void tick();},5000);void tick();
  app.on('before-quit',()=>{stopping=true;clearInterval(timer);engine.invalidate();observer.stop();model.close();server?.close();tray?.destroy();});
}
