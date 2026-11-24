import {preferences,savePreferences} from './settings.mjs';
import {store} from './account-store.mjs';
import {baseExercise} from './exercise-types.mjs';
export const phrases={
  hamstring:"Your thigh is moving. Keep it upright while bending your knee, and use your support for balance.",
  ready:"I'm here with you. Get into the starting position, and take your time.",
  lost:"I can't see the joints clearly. Adjust the camera so your whole movement is visible.",
  elbow:"Your upper arm is moving away from your side. Keep it steady while you curl your forearm.",
  arm:"Your elbow is bending. Keep your arm comfortably straight as you raise it.",
  knee:"Your thigh is tilting. Keep your thigh steady on the seat while moving your lower leg.",
  squat:"Your knees are bending while your hips stay open. Move your hips back as you bend, within your comfortable range.",
  hinge:"Your knees are bending deeply. For this movement, keep a soft knee bend and move from your hips.",
  fast:"That repetition was quick. Take a little more time on the next one.",
  two:"Only two repetitions left. Take your time. You've got this.",
  one:"One repetition left. Keep it comfortable and controlled.",
  rep:"Another repetition complete. You're making progress.",
  complete:"You reached your target. Well done! You can finish and save your session.",
  kneeReturn:"Bring your lower leg back toward the starting position, within your comfortable range.",
  elbowReturn:"Lower your forearm back toward the starting position.",
  armReturn:"Lower your arm back beside you.",
  squatReturn:"Come back up to standing at your own pace.",
  hingeReturn:"Bring your hips forward and stand upright at your own pace."
};
export function correction(exercise,landmarks,side,width,height,observation){
  const originalExercise=exercise; exercise=baseExercise(exercise);
  if(!observation)return null;
  const offset=side==='right'?1:0;
  const point=i=>{
    const p=landmarks?.[i+offset];
    return p&&p.visibility>=.75&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1?{x:p.x*width,y:p.y*height}:null;
  };
  const shoulder=point(11),elbow=point(13),wrist=point(15),hip=point(23),knee=point(25);
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  if(exercise==='Elbow curl'&&shoulder&&elbow&&hip){
    const length=distance(shoulder,hip);
    const cross=Math.abs((elbow.x-shoulder.x)*(hip.y-shoulder.y)-(elbow.y-shoulder.y)*(hip.x-shoulder.x));
    if(length>30&&cross/(length*length)>.25)return 'elbow';
  }
  if(exercise==='Arm raise'&&shoulder&&elbow&&wrist&&observation.angle>35){
    const a=distance(shoulder,elbow),b=distance(elbow,wrist),c=distance(shoulder,wrist);
    if(a>15&&b>15&&(a*a+b*b-c*c)/(2*a*b)>Math.cos(145*Math.PI/180))return 'arm';
  }
  if(originalExercise==='Standing hamstring curl'&&hip&&knee&&distance(hip,knee)>30&&Math.abs(hip.x-knee.x)/distance(hip,knee)>.5)return 'hamstring';
  if(originalExercise!=='Standing hamstring curl'&&exercise==='Knee bend'&&hip&&knee&&distance(hip,knee)>30&&
    Math.abs(hip.y-knee.y)/distance(hip,knee)>.5)return 'knee';
  if(exercise==='Bodyweight squat'&&observation.angle<120&&observation.secondary>145)return 'squat';
  if(exercise==='Hip hinge'&&observation.angle<140&&observation.secondary<130)return 'hinge';
  return null;
}
const returnKeys={'Knee bend':'kneeReturn','Elbow curl':'elbowReturn','Arm raise':'armReturn','Bodyweight squat':'squatReturn','Hip hinge':'hingeReturn'};
export class Coach {
  constructor(exercise,goal,emit){
    this.exercise=exercise;this.goal=goal;this.emit=emit;this.reps=0;
    this.lastSpeech=-Infinity;this.issue=null;this.issueSince=0;this.repeated=new Map();
    this.lastRep=null;this.phase=null;this.phaseSince=0;this.finished=false;
  }
  say(key,now,priority=1){
    if(now-this.lastSpeech<5000&&priority<3)return;
    if(now-(this.repeated.get(key)??-Infinity)<18000&&priority<3)return;
    this.lastSpeech=now;this.repeated.set(key,now);this.emit(key,priority);
  }
  update({visible,issue,reps,phase},now){
    if(this.finished)return;
    const problem=visible?issue:'lost';
    if(problem!==this.issue){this.issue=problem;this.issueSince=now}
    if(!visible){if(now-this.issueSince>1400)this.say('lost',now,2);this.phase=null;this.lastRep=null;return}
    if(reps>=this.goal){this.finished=true;this.say('complete',now,3);return}
    if(problem&&now-this.issueSince>1400){this.say(problem,now,2);this.reps=reps;return}
    if(reps>this.reps){
      const fast=this.lastRep!==null&&now-this.lastRep<1800;
      this.lastRep=now;this.reps=reps;
      const remaining=this.goal-reps;
      this.say(fast?'fast':remaining===2?'two':remaining===1?'one':'rep',now);
    }
    if(phase!==this.phase){this.phase=phase;this.phaseSince=now}
    if(phase==='bent'&&now-this.phaseSince>3500)this.say(returnKeys[this.exercise],now);
  }
}
export function createVoice(){
  const audio=new Audio();
  const caption=document.getElementById('coachCaption');
  const toggle=document.getElementById('coachVoice');
  const volume=document.getElementById('coachVolume');
  toggle.checked=store.getItem('kinarc.coachVoice')!=='off';
  volume.value=store.getItem('kinarc.coachVolume')||'0.8';
  let activePriority=0;
  function stop(){window.speechSynthesis?.cancel();audio.pause();audio.removeAttribute('src');audio.load();activePriority=0}
  toggle.onchange=()=>{store.setItem('kinarc.coachVoice',toggle.checked?'on':'off');if(!toggle.checked)stop()};
  volume.oninput=()=>{audio.volume=Number(volume.value);store.setItem('kinarc.coachVolume',volume.value);savePreferences({voiceVolume:Number(volume.value)})};
  function speak(key,priority=1){
    caption.textContent=phrases[key];
    if(!toggle.checked)return;
    if(!audio.paused&&priority<2)return;
    stop();activePriority=priority;
    audio.src='voice/coach-'+key+'.mp3';audio.volume=Number(volume.value);
    audio.play().catch(()=>{caption.textContent=phrases[key]+' (Audio unavailable. Use Test voice to retry.)'})
  }
  document.getElementById('testCoach').onclick=async()=>{
    if(document.getElementById('coachMode').value!=='local'){device(phrases.ready);return}
    caption.textContent='Generating a local voice preview…';
    try{
      const response=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({preview:true,instruction:'Introduce yourself in one friendly sentence. No movement is being performed.'})});
      const answer=await response.json();if(!response.ok)throw Error(answer.error);
      generated(answer.text,answer.audio);
    }catch{caption.textContent='Start the local coach and open http://localhost:8766 to use generated speech.'}
  };
  function generated(text,base64){
    caption.textContent=text;
    if(!toggle.checked)return;
    stop();audio.src='data:audio/wav;base64,'+base64;audio.volume=Number(volume.value);
    audio.play().catch(()=>{caption.textContent=text+' (Press Test voice to enable audio.)'});
  }
  function device(text){
    caption.textContent=text;if(!toggle.checked)return;stop();
    if(!window.speechSynthesis){caption.textContent=text+' (Speech is unavailable on this browser.)';return}
    const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=preferences().voiceRate;u.volume=Number(volume.value);
    const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.name===preferences().voiceName)||voices.find(v=>v.lang.startsWith('en')&&v.localService)||voices.find(v=>v.lang.startsWith('en'))||null;
    speechSynthesis.speak(u);
  }
  return {speak,stop,generated,device,isSpeaking:()=>!audio.paused||!!window.speechSynthesis?.speaking};
}
