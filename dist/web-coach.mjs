import {LocalCoach} from './local-coach.mjs';
import {phrases} from './coach.mjs';
import {baseExercise} from './exercise-types.mjs';
// Browser coaching is deliberately labelled: no remote generation is implied.
export class WebCoach {
  constructor(exercise,goal,voice){
    this.exercise=exercise;this.goal=goal;this.voice=voice;this.closed=false;
    this.issue=null;this.since=performance.now();this.last=-Infinity;this.reps=0;
    this.local=document.getElementById('coachMode').value==='local'?new LocalCoach(exercise,goal,voice,()=>{this.local=null;document.getElementById('coachCaption').textContent='Switched to device coaching. Local AI is unavailable.'}):null;
  }
  stop(){this.closed=true;this.local?.stop();this.voice.stop()}
  update(o,now){
    if(this.closed)return;
    if(this.local){this.local.update(o,now);return}
    const issue=o.visible?o.issue||null:'lost';
    if(issue!==this.issue){if(this.issue||issue)this.voice.stop();this.issue=issue;this.since=now}
    const changed=o.reps>this.reps;this.reps=o.reps;if(changed)this.pendingRep=true;
    const cooldown=issue?6500:this.pendingRep?2000:11000;
    if(this.voice.isSpeaking()||now-this.last<cooldown)return;
    let text;
    if(issue){if(now-this.since<1500)return;text=phrases[issue]}
    else if(this.pendingRep){this.pendingRep=false;const left=this.goal-o.reps;text=left<=0?phrases.complete:left===1?phrases.one:left===2?phrases.two:phrases.rep}
    else if(now-this.last>15000){
      const cues={'Knee bend':'Move your lower leg slowly, then return to the start.','Elbow curl':'Keep your upper arm beside you while your forearm moves.','Arm raise':'Lift with a comfortably straight arm, then lower slowly.','Bodyweight squat':'Move your hips back gently as your knees bend.','Hip hinge':'Keep a soft knee bend as your hips move back.'};
      text=o.visible?(o.reps>=this.goal?phrases.complete:cues[baseExercise(this.exercise)]):phrases.lost;
      if(this.exercise==='Standing hamstring curl'&&o.visible)text='Keep your thigh upright and use your support while your heel moves behind you.';
    }
    if(text){this.last=now;this.voice.device(text)}
  }
}
