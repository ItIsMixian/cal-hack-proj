import {DbConnection} from '../../src/module_bindings';
import type {ActivityEpisode,ActivityTheme} from '../../spacetimedb/src/activity';

export function createModelClient({endpoint,database,loadToken,saveToken}:{endpoint:string;database:string;loadToken:()=>Promise<string|undefined>;saveToken:(value:string)=>Promise<void>}){
  let active:DbConnection|null=null,pending:Promise<DbConnection>|null=null;
  const connect=()=>{
    if(active?.isActive)return Promise.resolve(active);
    if(pending)return pending;
    pending=(async()=>{
      const token=await loadToken();
      return new Promise<DbConnection>((resolve,reject)=>{
        let candidate:DbConnection|undefined;
        const timer=setTimeout(()=>{candidate?.disconnect();reject(new Error('Summary connection unavailable'));},15_000);
        const builder=DbConnection.builder().withUri(endpoint).withDatabaseName(database)
          .onConnect((conn,_identity,newToken)=>{clearTimeout(timer);active=conn;void saveToken(newToken);resolve(conn);})
          .onConnectError(()=>{clearTimeout(timer);active=null;reject(new Error('Summary connection unavailable'));})
          .onDisconnect(()=>{active=null;});
        // This identity is the background summarizer's own principal. It never
        // receives a town account token and never calls reducers/imports.
        if(token)builder.withToken(token);
        candidate=builder.build();
      });
    })().finally(()=>{pending=null;});
    return pending;
  };
  return {
    async summarize(args:{mirrorId:undefined;episodes:ActivityEpisode[];previousMemory:string}):Promise<ActivityTheme[]>{
      const conn=await connect();let timer:ReturnType<typeof setTimeout>|undefined;
      try{return await Promise.race([conn.procedures.understandActivity({...args,mirrorId:undefined}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{conn.disconnect();active=null;reject(new Error('Summary timed out'));},90_000);})]);}
      finally{clearTimeout(timer);}
    },
    close(){active?.disconnect();active=null;},
  };
}
