import {createHmac,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {createConnection,createServer} from 'node:net';
import path from 'node:path';

const signature=(key,value)=>createHmac('sha256',key).update(JSON.stringify(value)).digest('hex');
const equal=(a,b)=>typeof a==='string'&&/^[a-f0-9]{64}$/.test(a)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
export function agentPipe(root){
  const id=createHash('sha256').update(path.resolve(root).toLowerCase()).digest('hex').slice(0,24);
  return process.platform==='win32'?`\\\\.\\pipe\\mirrorville-background-${id}`:path.join(root,'agent.sock');
}
export function requestAgent(pipe,key,method,body={},timeout=10_000){
  return new Promise((resolve,reject)=>{
    const nonce=randomBytes(16).toString('hex'),socket=createConnection(pipe);socket.setEncoding('utf8');let buffer='',settled=false;
    const fail=()=>{if(!settled){settled=true;reject(new Error('Observation is not connected.'));}socket.destroy();};
    socket.setTimeout(timeout,fail);socket.on('error',fail);socket.on('end',()=>{if(!settled)fail();});
    socket.on('connect',()=>socket.write(JSON.stringify({nonce,method,body,signature:signature(key,[nonce,method,body])})+'\n'));
    socket.on('data',data=>{
      buffer+=data.toString('utf8');if(buffer.length>1_000_000)return fail();
      if(!buffer.includes('\n'))return;
      try{
        const reply=JSON.parse(buffer.slice(0,buffer.indexOf('\n')));
        if(reply.nonce!==nonce||!equal(reply.signature,signature(key,[nonce,reply.value??null,reply.error??null])))return fail();
        settled=true;socket.end();
        if(reply.error)reject(new Error(reply.error));else resolve(reply.value);
      }catch{fail();}
    });
  });
}
export async function serveAgent(pipe,key,valid,handle){
  const server=createServer(socket=>{
    socket.setEncoding('utf8');socket.setTimeout(10_000,()=>socket.destroy());let buffer='',used=false;
    socket.on('error',()=>{});
    socket.on('data',async data=>{
      if(used)return;buffer+=data;if(buffer.length>65_536){used=true;socket.destroy();return;}
      if(!buffer.includes('\n'))return;used=true;
      try{
        const req=JSON.parse(buffer.slice(0,buffer.indexOf('\n')));
        if(!/^[a-f0-9]{32}$/.test(req.nonce)||!equal(req.signature,signature(key,[req.nonce,req.method,req.body]))||!valid(req.method,req.body)){socket.destroy();return;}
        let value=null,error=null;
        try{value=await handle(req.method,req.body);}catch{error='The action could not finish. Existing notes remain on this computer.';}
        socket.end(JSON.stringify({nonce:req.nonce,value,error,signature:signature(key,[req.nonce,value,error])})+'\n');
      }catch{socket.destroy();}
    });
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen({path:pipe,readableAll:false,writableAll:false},resolve);});
  return server;
}
