export class Workout {
 constructor({sets=1,reps=5,rest=30,countdown=3}={}){if(!Number.isInteger(sets)||sets<1||sets>10||!Number.isInteger(reps)||reps<1||reps>100||!Number.isFinite(rest)||rest<0||rest>300)throw Error('Invalid workout configuration');this.config={sets,reps,rest,countdown};this.state='positioning';this.set=1;this.completed=[];this.visibleSince=null;this.total=0;this.pausedAt=null}
 positioned(visible,now){if(this.state==='countdown'&&!visible){this.state='positioning';this.visibleSince=null;return}if(this.state!=='positioning')return;if(!visible){this.visibleSince=null;return}this.visibleSince??=now;if(now-this.visibleSince>=800){this.state='countdown';this.deadline=now+this.config.countdown*1000}}
 tick(now){if(this.state==='countdown'&&now>=this.deadline)this.state='active';if(this.state==='rest'&&now>=this.deadline){this.set++;this.state='positioning';this.visibleSince=null;return 'next'}return null}
 completeSet(reps,now){if(this.state!=='active'||reps<this.config.reps)return false;this.completed.push({set:this.set,reps});this.total+=reps;if(this.set>=this.config.sets)this.state='complete';else{this.state='rest';this.deadline=now+this.config.rest*1000}return true}
 remaining(now){return Math.max(0,Math.ceil(((this.deadline||now)-now)/1000))}
 pause(now){if(this.state==='paused'||this.state==='complete')return;this.previous=this.state;this.pausedAt=now;this.state='paused'}
 resume(now){if(this.state!=='paused')return;if(this.deadline)this.deadline+=now-this.pausedAt;this.state=this.previous==='active'?'positioning':this.previous;this.visibleSince=null;this.pausedAt=null}
}
