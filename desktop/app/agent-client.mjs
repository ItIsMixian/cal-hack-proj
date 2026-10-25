import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {agentPipe,requestAgent} from './agent-transport.mjs';

export class AgentClient {
  constructor({base,executable,isPackaged,decrypt}){
    this.root=path.join(base,'background-agent');this.pipe=agentPipe(this.root);
    this.executable=executable;this.isPackaged=isPackaged;this.decrypt=decrypt;this.started=null;
  }
  async key(){return readFile(path.join(this.root,'key.hex'),'utf8');}
  async ready(){
    if(this.started)return this.started;
    this.started=(async()=>{
      try{await requestAgent(this.pipe,await this.key(),'backgroundStatus');return;}catch{}
      const here=path.dirname(fileURLToPath(import.meta.url));
      const args=this.isPackaged?['--background-agent']:[path.resolve(here,'../..'),'--background-agent'];
      const child=spawn(this.executable,args,{detached:true,windowsHide:true,stdio:'ignore'});child.on('error',()=>{});child.unref();
      for(let attempt=0;attempt<80;attempt++){
        try{await requestAgent(this.pipe,await this.key(),'backgroundStatus',{},1000);return;}catch{}
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      throw new Error('Observation could not start.');
    })().catch(error=>{this.started=null;throw error;});return this.started;
  }
  async request(method,body={}){
    await this.ready();
    try{return await requestAgent(this.pipe,await this.key(),method,body);}
    catch(error){
      if(method!=='backgroundConfigure')throw error;
      // Only an explicit resume/start action restarts a service the owner quit.
      this.started=null;await this.ready();return requestAgent(this.pipe,await this.key(),method,body);
    }
  }
  // Town shutdown deliberately has no effect on the independent background service.
  stop(){}
}
