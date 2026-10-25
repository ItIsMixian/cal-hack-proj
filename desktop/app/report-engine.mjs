// No renderer, town window, user login token, imports or public-table writes here.
export class ReportEngine {
  constructor({observer,summarize,config={},persist=async()=>{},now=Date.now}){
    this.observer=observer;this.summarize=summarize;this.config=config;this.persist=persist;this.now=now;
    this.busy=false;this.epoch=0;this.nextAt=0;this.lastAt=null;this.error='';this.skipped={};
  }
  invalidate(){this.epoch++;this.nextAt=0;}
  async configure(config){this.invalidate();this.config={...this.config,...config};this.error='';await this.persist(this.config);}
  status(){return {enabled:this.config.enabled===true,scope:this.config.scope??'',mirrorId:this.config.mirrorId??'',busy:this.busy,lastAt:this.lastAt,error:this.error,nextAt:this.nextAt};}
  async run(force=false){
    if(this.busy||!this.config.scope||(!force&&(!this.config.enabled||this.now()<this.nextAt)))return;
    const epoch=this.epoch,config={...this.config};let modelCalled=false;
    const allowed=()=>epoch===this.epoch&&this.config.scope===config.scope&&(force||this.config.enabled);
    this.busy=true;
    try{
      const status=await this.observer.request('status');
      if(!allowed()||(!force&&(!status.enabled||!status.contextTitles)))return;
      const state=await this.observer.request('dailyReports',{scope:config.scope});
      const period=state.days.find(d=>this.skipped[config.scope+'|'+d.date]!==d.hash&&!state.reports.some(r=>r.date===d.date&&r.hash===d.hash));
      if(!period||!allowed())return;
      const context=await this.observer.request('dailyContext',{scope:config.scope,date:period.date});
      if(!context.episodes.length||!allowed())return;
      modelCalled=true;
      const themes=await this.summarize({mirrorId:undefined,episodes:context.episodes,previousMemory:JSON.stringify({mode:'period-report',period:period.date,overview:context.overview,previousReports:context.previousReports,ownerBackground:config.background??''}).slice(0,6000)});
      if(!allowed())return;
      if(!themes.length){this.skipped[config.scope+'|'+period.date]=context.hash;this.skipped=Object.fromEntries(Object.entries(this.skipped).slice(-336));this.nextAt=this.now()+30_000;this.error='';return;}
      if(themes.length!==1)throw new Error('format');
      await this.observer.request('saveDailyReport',{scope:config.scope,date:period.date,hash:context.hash,generation:context.generation,episodeIds:context.episodes.map(e=>e.id),themes});
      this.lastAt=this.now();this.error='';this.nextAt=this.now()+15*60_000;
    }catch{
      if(allowed()){this.error='The summary is not ready. Notes remain local and will resume when the connection returns.';this.nextAt=this.now()+15*60_000;}
    }finally{
      this.busy=false;
      // No work is not a fifteen-minute lockout on newly arriving activity.
      if(!modelCalled&&this.nextAt<this.now())this.nextAt=this.now()+30_000;
    }
  }
}
