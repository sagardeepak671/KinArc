// One in-flight generation per session. Outdated observations are never played.
export class LocalCoach {
  constructor(exercise, goal, voice, unavailable) {
    this.unavailable=unavailable;this.exercise=exercise;
    this.goal=goal;
    this.voice=voice;
    this.history=[];
    this.samples=[];
    this.started=performance.now();
    this.lastRequest=-Infinity;
    this.issue=null;
    this.issueSince=this.started;
    this.closed=false;
    this.busy=false;
  }
  stop() {
    this.closed=true;
    this.controller?.abort();
    this.voice.stop();
  }
  async update(observation, now) {
    if(this.closed)return;
    const issue=observation.visible?observation.issue||null:'visibility';
    if(issue!==this.issue){this.previousIssue=this.issue;this.issue=issue;this.issueSince=now}
    if(this.voice.isSpeaking?.() && this.spokenIssue!==undefined && this.spokenIssue!==this.issue)this.voice.stop();
    this.latest=observation;
    if(!this.lastSample||now-this.lastSample>=500){
      this.samples.push({...observation,time:Math.round((now-this.started)/1000)});
      this.lastSample=now;
    }
    this.samples=this.samples.slice(-12);
    const delay=issue?6500:11000;
    if(this.busy||this.voice.isSpeaking?.()||now-this.lastRequest<delay||now-this.started<1800||
       (issue&&now-this.issueSince<1500))return;
    this.busy=true;this.lastRequest=now;
    const requestIssue=issue;
    this.controller=new AbortController();
    const timeout=setTimeout(()=>this.controller.abort(),15000);
    try {
      const response=await fetch('/api/coach',{
        method:'POST',headers:{'Content-Type':'application/json'},
        signal:this.controller.signal,
        body:JSON.stringify({exercise:this.exercise,target:this.goal,
          previousIssue:this.previousIssue,current:observation,issueDurationSeconds:Math.round((now-this.issueSince)/1000),
          recentMovement:this.samples,previousFeedback:this.history})
      });
      const answer=await response.json();
      if(!response.ok)throw Error(answer.error||'Local coach unavailable');
      if(this.closed||requestIssue!==this.issue||performance.now()-now>16000)return;
      this.history.push(answer.text);this.history=this.history.slice(-4);
      this.spokenIssue=requestIssue;
      this.previousIssue=null;
      this.voice.generated(answer.text,answer.audio);
      this.lastRequest=performance.now();
    }catch(error){
      if(!this.closed){this.unavailable?.();const caption=document.getElementById('coachCaption');if(caption)caption.textContent='Local AI unavailable. Device coaching will continue.'}
    }finally{clearTimeout(timeout);this.busy=false}
  }
}
