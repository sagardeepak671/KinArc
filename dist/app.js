import {Workout} from './workout.mjs';
import {exercises} from './exercises.mjs';
import {database} from './account-store.mjs';
import {notify,ask} from './ui.mjs';
import {setupExperience,catalog} from './experience.mjs';
import {store} from './account-store.mjs';
import {baseExercise} from './exercise-types.mjs';
import {WebCoach} from './web-coach.mjs';
import {correction, createVoice} from './coach.mjs';
import {setupPlan} from './plan.mjs';
import {setupReport} from './report.mjs';
import {portrait} from './character.mjs';
import {knee,CycleTracker} from './tracker.mjs';
const $=id=>document.getElementById(id);
$('goal').replaceChildren(...Array.from({length:100},(_,i)=>new Option(String(i+1),String(i+1),false,i===4)));
const canvas=document.querySelector('.monitor canvas'), ctx=canvas.getContext('2d'), video=document.querySelector('video');
const membersKey='kinarc.members.v1';
let members;
try{members=JSON.parse(store.getItem(membersKey)||'[ {"id":"original","name":"My workshop"} ]');if(!Array.isArray(members)||!members.length||members.some(m=>!m||typeof m.id!=='string'||typeof m.name!=='string'))throw Error('Invalid profiles')}catch{members=[{id:'original',name:'My workshop'}]}
if(!store.getItem(membersKey))store.setItem(membersKey,JSON.stringify(members));
let member=members.find(m=>m.id===store.getItem('kinarc.active'))||members[0];
function storageKey(){return member.id==='original'?'kinarc.sessions.v1':'kinarc.sessions.'+member.id}
let current=null,updateExperience;
const voice=createVoice();
let plannedItem=null;
function records(){
  const rows=JSON.parse(store.getItem(storageKey())||'[]');
  if(!Array.isArray(rows))throw Error('Invalid journal');
  return rows.filter(r=>r&&Number.isFinite(Date.parse(r.date))&&Number.isFinite(r.reps)&&r.reps>=0).map(r=>({...r,seconds:Number.isFinite(r.seconds)?r.seconds:0,note:typeof r.note==='string'?r.note:''}));
}
const journal=setupReport(records,()=>member.name,async rows=>{store.setItem(storageKey(),JSON.stringify(rows));await database.flush();updateExperience?.()});
function sculpt(points){
  ctx.lineCap='round';ctx.lineJoin='round';
  const scale=canvas.width/720;
  for(const [i,p] of points.entries()){
    if(i){const q=points[i-1];ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(p.x,p.y);ctx.lineWidth=14*scale;ctx.strokeStyle='#804833';ctx.stroke();ctx.lineWidth=8*scale;ctx.strokeStyle='#dc9d70';ctx.stroke()}
    ctx.beginPath();ctx.arc(p.x,p.y,8*scale,0,Math.PI*2);ctx.fillStyle='#ffcc92';ctx.fill()
  }
}
function rehearsal(angle){
  document.querySelector('.monitor').style.aspectRatio='16/9';canvas.width=720;canvas.height=405;
  portrait(ctx,$('exercise').value,$('side').value,angle??(baseExercise($('exercise').value)==='Arm raise'?8:168));
}
function time(s){return s.mode==='Video file'?video.currentTime:((s.completedAt|| (s.paused?s.pauseStarted:performance.now()))-s.started-(s.pausedMs||0))/1000}
function readout(s){
  if(s.tracker.min!==null){s.observedMin=Math.min(s.observedMin??180,s.tracker.min);s.observedMax=Math.max(s.observedMax??0,s.tracker.max)}
  $('finish').disabled=s.saving||s.observedMin==null;const t=Math.floor(time(s));$('timer').textContent=Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
  $('sessionProgress').max=s.goal;$('sessionProgress').value=Math.min(s.goal,s.tracker.reps);$('phaseHint').textContent=s.paused?'Paused · resume when ready':s.tracker.reps>=s.goal?'Target reached. Finish & save when ready.':s.tracker.phase==='waiting'?'Find the starting position and hold briefly.':s.tracker.phase==='bent'?'Return slowly to complete this repetition.':'Move toward the target, then return.';
  $('angle').textContent=s.tracker.angle===null?'—':Math.round(s.tracker.angle)+'°';$('count').textContent=s.tracker.reps+' / '+s.goal;$('setReadout').textContent='Set '+s.workout.set+' / '+s.workout.config.sets;
  const state=s.workout.state;$('workoutState').textContent=state==='countdown'?'Starting in '+s.workout.remaining(performance.now()):state==='rest'?'Rest · '+s.workout.remaining(performance.now())+'s':state==='positioning'?'Position your body and hold steady':state==='complete'?(s.mode==='Video file'?'Analysis complete':'Workout complete'):state==='paused'?'Paused':s.mode==='Video file'?'Analyzing video':'Tracking movement';
}
function cue(text){if($('cue').textContent!==text)$('cue').textContent=text}
function consume(s,result,t){
  if(current!==s||s.closed||s.paused)return;
  const w=video.videoWidth,h=video.videoHeight;canvas.width=w;canvas.height=h;
  const obs=knee(result.poseLandmarks,s.side,w,h,s.exercise);
  if(s.mode!=='Video file'){s.workout.positioned(!!obs,performance.now());advance(s);if(s.workout.state!=='active'){readout(s);return}}
  if(obs&&s.previousPose&&t-s.previousPose.time<350){const old=s.previousPose.points,dx=obs.pixels.map((p,i)=>p.x-old[i].x),dy=obs.pixels.map((p,i)=>p.y-old[i].y),mx=dx.reduce((a,b)=>a+b,0)/dx.length,my=dy.reduce((a,b)=>a+b,0)/dy.length;if(Math.hypot(mx/w,my/h)>.12&&dx.every((x,i)=>Math.hypot((x-mx)/w,(dy[i]-my)/h)<.04)){s.tracker.resetSignal();s.previousPose={points:obs.pixels,time:t};cue('View moved suddenly. Hold the camera steady and return to the start.');return}}
  s.previousPose=obs?{points:obs.pixels,time:t}:null;
  s.tracker.observe(obs?.angle,t,obs?.secondary);if(s.mode==='Video file'&&obs){s.timeline.push({time:Math.round(t)/1000,angle:Math.round(obs.angle),reps:s.tracker.reps});if(s.timeline.length>1500)s.timeline=s.timeline.filter((_,i)=>i%2===0)}
  advance(s);
  s.buddy.update({visible:!!obs,issue:correction(s.exercise,result.poseLandmarks,s.side,w,h,obs),angle:obs?.angle,secondaryAngle:obs?.secondary,side:s.side,frameAspect:w/h,
      joints:result.poseLandmarks?.map((p,i)=>({index:i,x:Math.round(p.x*1000)/1000,y:Math.round(p.y*1000)/1000,visibility:Math.round(p.visibility*100)/100})).filter(p=>[11,12,13,14,15,16,23,24,25,26,27,28].includes(p.index)),
      reps:s.tracker.reps,phase:s.tracker.phase},performance.now());
  $('visibilityState').textContent=obs?'Required joints visible':'Tracking interrupted · show the required joints';
  if(obs){if($('skeletonToggle').checked)sculpt(obs.pixels);coach(s)}
  else cue('Tracking paused. Keep all the joints named in the exercise guide visible.');
  readout(s);
}
function begin(mode){
  const s={mode,side:$('side').value,exercise:$('exercise').value,goal:Number($('goal').value),tracker:new CycleTracker($('exercise').value,{start:Number($('rangeStart').value),end:Number($('rangeEnd').value)}),started:performance.now(),closed:false};
  s.timeline=[];s.workout=new Workout({sets:mode==='Video file'?1:Number($('sets').value),reps:s.goal,rest:Number($('restSeconds').value)});if(mode==='Video file')s.workout.state='active';
  s.buddy=new WebCoach(s.exercise,s.goal,voice);s.pausedMs=0;$('pauseSession').hidden=false;$('pauseSession').disabled=false;$('pauseSession').textContent='Pause session';
  navigator.wakeLock?.request('screen').then(lock=>{if(s.closed)lock.release();else s.wakeLock=lock}).catch(()=>{});
  $('reflection').value='';current=s;for(const id of ['sets','restSeconds','rangeStart','rangeEnd'])$(id).disabled=true;$('exercise').disabled=$('goal').disabled=true;$('start').hidden=true;$('active').hidden=false;$('side').disabled=true;$('coachMode').disabled=$('cameraFacing').disabled=true;$('finish').disabled=true;$('badge').textContent=mode;readout(s);requestAnimationFrame(()=>{if(current===s)document.querySelector('.surface').scrollIntoView({block:'start',behavior:'smooth'})});return s;
}
function release(s){
  s.buddy.stop();voice.stop();s.wakeLock?.release().catch(()=>{});s.closed=true;cancelAnimationFrame(s.frame);s.media?.getTracks().forEach(t=>t.stop());
  video.onended=null;video.pause();video.srcObject=null;video.removeAttribute('src');video.load();
  if(s.url)URL.revokeObjectURL(s.url);
  // An in-flight native inference must finish before its WASM graph is destroyed.
  Promise.resolve(s.pending).catch(()=>{}).then(()=>s.pose?.close()).catch(()=>{});
}
function end(s){
  if(current!==s)return;release(s);current=null;for(const id of ['sets','restSeconds','rangeStart','rangeEnd'])$(id).disabled=false;$('exercise').disabled=$('goal').disabled=false;$('active').hidden=true;$('start').hidden=false;$('side').disabled=false;$('coachMode').disabled=$('cameraFacing').disabled=false;$('badge').textContent='Ready';$('pauseSession').hidden=true;rehearsal();
}
async function startVision(file){
  if(current)return;
  let s;try{s=begin(file?'Video file':'Camera')}catch(e){notify(e.message);return}let stage=file?'video':'camera';
  try{
    if(file){$('analysisNote').textContent='Preparing video analysis…';$('analysisProgress').value=0;$('analysisProgress').hidden=false;s.url=URL.createObjectURL(file);video.src=s.url}
    else{$('analysisProgress').hidden=true;$('analysisNote').textContent='';
      cue('Waiting for camera access…');
      if(!navigator.mediaDevices?.getUserMedia)throw Error('Use localhost or HTTPS to open the camera.');
      const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:960},height:{ideal:540},facingMode:{ideal:$('cameraFacing').value}}});
      if(s.closed){media.getTracks().forEach(t=>t.stop());return}
      s.media=media;video.srcObject=media;
    }
    await video.play();if(s.closed)return;document.querySelector('.monitor').style.aspectRatio=video.videoWidth+'/'+video.videoHeight;
    if(file)video.pause();
    if(file&&(!Number.isFinite(video.duration)||video.duration>900))throw Error('Choose a video no longer than 15 minutes.');
    stage='model';await loadPose();if(s.closed)return;
    cue('Preparing the on-device pose model…');
    const modelURL=new URL('pose_landmark_full.tflite',document.baseURI);
    const response=await fetch(modelURL);if(!response.ok)throw Error('The bundled pose model is missing.');
    if(s.closed)return;
    s.pose=new Pose({locateFile:f=>new URL(f,document.baseURI).href});
    s.pose.setOptions({modelComplexity:1,smoothLandmarks:true});
    s.pose.onResults(r=>consume(s,r,s.sampleTime));
    s.sampleTime=video.currentTime*1000;
    s.pending=s.pose.send({image:video});await s.pending;if(s.closed)return;
    if(file){await analyzeVideo(s);return}
    s.started=performance.now();let last=-1;
    async function next(){
      if(s.closed)return;
      if(s.workout.state==='complete'){s.media?.getTracks().forEach(t=>t.stop());s.wakeLock?.release().catch(()=>{});return}
      try{
        if(!s.paused && video.readyState>=2 && video.currentTime!==last){
          last=video.currentTime;s.sampleTime=last*1000;s.pending=s.pose.send({image:video});await s.pending;
        }
        if(s.closed)return;
        if(video.ended){s.buddy.stop();voice.stop();cue(s.tracker.min===null?'Video ended without a clear knee measurement. Discard and try a side view.':'Video complete. Save the measurements to your journal.');return}
        s.frame=requestAnimationFrame(next);
      }catch(e){failure(e)}
    }next();
  }catch(e){failure(e)}
  function failure(e){
    if(s.closed)return;end(s);
    const message=e.name==='NotAllowedError'?'Camera access was denied. Enable it in this site’s browser settings or select a video.':
      e.name==='NotFoundError'?'No camera was found. Connect a camera or select a video.':
      stage==='model'?'Pose inference failed. Reload the studio and check that your browser supports WebGL.':
      stage==='video'?'This video could not play. Try a browser-compatible MP4.':'Camera unavailable. Close other camera apps and try again.';
    cue(message+' ('+e.message+')')
  }
}
$('demo').onclick=()=>{
  if(current)return;let s;try{s=begin('Clay rehearsal')}catch(e){notify(e.message);return}cue('Rehearsal uses an animated signal. Its journal entry is labeled separately.');
  function tick(t){if(s.closed)return;if(s.workout.state==='complete'){readout(s);return}if(s.paused){s.frame=requestAnimationFrame(tick);return}const range=s.tracker.range,raised=exercises[s.exercise].raised,start=raised?Math.max(2,range.start-10):Math.min(178,range.start+10),end=raised?Math.min(178,range.end+10):Math.max(2,range.end-10),progress=(1-Math.cos((t-s.started-s.pausedMs)/700))/2,angle=start+(end-start)*progress;rehearsal(angle);s.workout.positioned(true,t);advance(s);if(s.workout.state==='active'){s.tracker.observe(angle,t,baseExercise(s.exercise)==='Hip hinge'?155:angle);advance(s)}coach(s);if(s.workout.state==='active')s.buddy.update({visible:true,reps:s.tracker.reps,phase:s.tracker.phase},t);readout(s);s.frame=requestAnimationFrame(tick)}
  tick(performance.now())
};
$('camera').onclick=()=>startVision();$('upload').onclick=()=>$('file').click();

$('pauseSession').onclick=async()=>{const s=current;if(!s)return;if(s.paused){s.pausedMs+=performance.now()-s.pauseStarted;s.paused=false;s.workout.resume(performance.now());s.tracker.resetSignal();s.buddy=new WebCoach(s.exercise,s.goal,voice);try{if(s.mode==='Camera')await video.play();if(s.mode==='Video file'){video.pause();s.workout.state='active'}}catch{end(s);cue('Playback could not resume. Start a new session.');return}$('pauseSession').textContent='Pause session'}else{s.paused=true;s.pauseStarted=performance.now();s.workout.pause(s.pauseStarted);s.buddy.stop();video.pause();$('pauseSession').textContent='Resume session'}readout(s)};
$('cancel').onclick=async()=>{if(current&&current.tracker.reps>0&&!await ask('Discard session?','Your unsaved repetitions will be lost.',{confirm:'Discard',danger:true}))return;if(current)end(current);cue('Session discarded. Choose a source to begin again.')};
$('finish').onclick=async()=>{
  const s=current;if(!s||(s.observedMin??s.tracker.min)===null||s.saving)return;s.saving=true;$('finish').disabled=true;
  const min=s.observedMin??s.tracker.min,max=s.observedMax??s.tracker.max;const reps=s.mode==='Video file'?s.tracker.reps:s.workout.total+(s.workout.state==='complete'||s.workout.state==='rest'?0:s.tracker.reps);const row={setsCompleted:s.mode==='Video file'&&s.tracker.reps>=s.goal?1:s.workout.completed.length,setsPlanned:s.workout.config.sets,completedSets:s.workout.completed,timeline:s.timeline,range:s.tracker.range,id:crypto.randomUUID(),note:$('reflection').value.trim(),planId:plannedItem,date:new Date().toISOString(),mode:s.mode,side:s.side,exercise:s.exercise,goal:s.goal,seconds:s.mode==='Video file'&&s.analyzed?Math.round(video.duration):Math.floor(time(s)),min,max,reps};
  try{store.setItem(storageKey(),JSON.stringify([row,...records()]));await database.flush();store.removeItem('kinarc.draft');await database.flush();end(s);journal();updateExperience?.();document.dispatchEvent(new CustomEvent('kinarc-saved',{detail:row}));$('summaryContent').textContent=row.exercise+' · '+row.side+' side · '+row.reps+' / '+row.goal*row.setsPlanned+' reps · '+row.setsCompleted+' / '+row.setsPlanned+' sets · '+Math.floor(row.seconds/60)+'m '+row.seconds%60+'s';$('summaryNote').textContent=row.mode==='Clay rehearsal'?'Rehearsal saved separately. It does not count toward your tracked streak.':'Saved to '+member.name+'’s journal. Observed angles: '+row.min+'°–'+row.max+'°.';$('sessionSummary').showModal();cue('Saved to your practice journal.')}catch{s.saving=false;$('finish').disabled=false;cue('Saving failed. Check browser storage and try again.')}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&current){end(current);cue('Session stopped because the app moved to the background. Start a new session when ready.')}});
window.addEventListener('beforeunload',e=>{if(current?.tracker.reps>0){e.preventDefault();e.returnValue=''}});
window.addEventListener('pagehide',()=>{if(current)end(current)});
function guide(reset=true){const e=exercises[$('exercise').value];if(reset){$('rangeStart').value=e.start;$('rangeEnd').value=e.end}$('exerciseMeta').textContent=e.area+' · '+e.view+' · '+e.equipment;$('guide').textContent=e.instructions.join(' ')+' Start endpoint: '+$('rangeStart').value+'°. Turning endpoint: '+$('rangeEnd').value+'°. Pause briefly at each end.';cue('Demonstration ranges are not clinically prescribed targets.')}
function coach(s){const e=exercises[s.exercise];cue(s.workout.state==='rest'?'Rest comfortably before the next set.':s.workout.state==='complete'?'Workout target reached. Finish & save when ready.':s.tracker.phase==='extended'?e.instructions[2]:s.tracker.phase==='bent'?e.instructions[3]:e.instructions[1])}
$('rangeStart').onchange=$('rangeEnd').onchange=()=>guide(false);
$('side').onchange=()=>rehearsal();$('exercise').onchange=()=>{guide();rehearsal()};guide();journal();rehearsal();

portrait(document.querySelector('#cover').getContext('2d'),'Knee bend','left',157);

const refreshPlan=setupPlan(()=>member.id,records,item=>{
  plannedItem=item.id;$('sets').value=item.sets||1;$('restSeconds').value=item.rest??30;
  $('exercise').value=item.exercise;
  $('goal').value=String(item.goal);
  $('side').value=item.side;
  guide();rehearsal();location.hash='workbench'
});
for(const id of ['exercise','side','goal','sets','restSeconds']) $(id).addEventListener('change',()=>{plannedItem=null});
function showMember(){
  plannedItem=null;
  refreshPlan();
  $('member').replaceChildren(...members.map(m=>new Option(m.name,m.id)));
  $('member').value=member.id;
  document.querySelectorAll('.owner').forEach(a=>a.textContent=member.name==='My workshop'?'My profile':member.name);
  journal();updateExperience?.();
}
function switchMember(id){
  if(current)return;
  member=members.find(m=>m.id===id);
  store.setItem('kinarc.active',id);showMember();
  $('profileNote').textContent='Active profile: '+member.name;
}
$('member').onchange=e=>switchMember(e.target.value);
$('addMember').onsubmit=e=>{
  e.preventDefault();if(current)return;
  const name=$('newName').value.trim();
  if(!name || members.some(m=>m.name.toLowerCase()===name.toLowerCase())){$('profileNote').textContent='Choose a distinct, non-empty name.';return}
  const next={name,id:crypto.randomUUID()};
  members=[...members,next];store.setItem(membersKey,JSON.stringify(members));switchMember(next.id);e.target.reset()
};
const pages={landing:'landing',library:'library',about:'about',privacy:'privacy',terms:'terms',settings:'settings',coach:'coach',details:'exerciseDetails',progress:'progress',plan:'plan',home:'studioHome',workbench:'workbench',journal:'journal',profiles:'profiles',help:'help'};
function route(){
  let page=location.hash.slice(1);if(page==='how'){page='landing';setTimeout(()=>{if(document.body.dataset.page==='landing')document.getElementById('howSection').scrollIntoView({behavior:'smooth'})},50)}if(!Object.hasOwn(pages,page))page=store.getItem('kinarc.onboarding.done')==='yes'?'home':'landing';document.body.dataset.page=page;
  if(current && page!=='workbench'){history.replaceState(null,'','#workbench');page='workbench';cue('Finish or discard this session before leaving practice.')}
  for(const [name,id] of Object.entries(pages))$(id).hidden=name!==page;
  for(const a of document.querySelectorAll('nav a')){if(a.hash==='#'+(page==='details'?'library':page))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  if(page==='home')updateExperience?.();
  if(page==='journal')journal();
  if(page==='plan')refreshPlan();
  const titles={home:'Overview',landing:'Camera-assisted exercise',library:'Exercise library',workbench:'Workout',journal:'Workout history',profiles:'Account & profiles',plan:'Routine planner',details:store.getItem('kinarc.lastDetail')||'Exercise guide'};document.title=(titles[page]||page[0].toUpperCase()+page.slice(1))+' · KinArc';document.dispatchEvent(new CustomEvent('kinarc-route',{detail:page}));
  if(page!=='workbench')plannedItem=null;
  window.scrollTo({top:0,behavior:'instant'})
}
for(const option of $('exercise').options){
  const tile=document.createElement('button'), pic=document.createElement('canvas'), label=document.createElement('span');
  pic.width=320;pic.height=195;label.textContent=option.value;tile.append(pic,label);$('shelf').append(tile);
  portrait(pic.getContext('2d'),option.value,'left',baseExercise(option.value)==='Arm raise'?80:100);
  tile.onclick=()=>{plannedItem=null;$('exercise').value=option.value;guide();rehearsal();location.hash='workbench'}
}
function theme(dark){
  document.documentElement.dataset.theme=dark?'dark':'light';$('theme').textContent=dark?'Light mode':'Dark mode'
}
theme((store.getItem('kinarc.theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))==='dark');
$('theme').onclick=()=>{theme(document.documentElement.dataset.theme!=='dark');store.setItem('kinarc.theme',document.documentElement.dataset.theme)};
updateExperience=setupExperience({read:records,profile:()=>member,refresh:refreshPlan,select:exercise=>{if(current)return;plannedItem=null;$('exercise').value=exercise;guide();rehearsal();location.hash='workbench'}});
$('summaryRepeat').onclick=()=>{$('sessionSummary').close();location.hash='workbench'};
$('summaryHistory').onclick=()=>{$('sessionSummary').close();$('reportSource').value='all';$('reportExercise').value='All exercises';$('reportDate').value=new Date().toLocaleDateString('en-CA');location.hash='journal'};
$('summaryClose').onclick=()=>{$('sessionSummary').close();location.hash='home'};
window.addEventListener('hashchange',route);showMember();route();

window.kinarc={stop:()=>{if(current)end(current)},active:()=>!!current,profile:()=>member,records,refresh:()=>{showMember();refreshPlan()},select:exercise=>{if(current)return;plannedItem=null;$('exercise').value=exercise;guide();rehearsal();location.hash='workbench'},trial:()=>{$('trial').click()},setPlan:item=>{if(current)return;plannedItem=item.id;$('exercise').value=item.exercise;$('goal').value=item.goal;$('sets').value=item.sets||1;$('restSeconds').value=item.rest??30;$('side').value=item.side;guide();rehearsal();location.hash='workbench'}};

let poseScript;
async function loadPose(){if(window.Pose)return;poseScript??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='pose.js';script.onload=resolve;script.onerror=()=>{poseScript=null;reject(Error('Pose engine could not download. Check the offline download in Settings.'))};document.head.append(script)});await poseScript}
function advance(s){
 const now=performance.now();if(s.workout.tick(now)==='next'){s.tracker=new CycleTracker(s.exercise,s.tracker.range);s.buddy=new WebCoach(s.exercise,s.goal,voice)}
 if(s.mode!=='Video file'&&s.workout.completeSet(s.tracker.reps,now)){if(s.workout.state==='complete'){s.completedAt=now;$('pauseSession').disabled=true}s.buddy.stop();voice.device(s.workout.state==='rest'?'Set complete. Rest comfortably before your next set.':'You reached your workout target. Finish and save when ready.');}
}
async function seek(time,s){if(Math.abs(video.currentTime-time)<.015&&video.readyState>=2)return;await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);video.removeEventListener('seeked',done);resolve()};const timer=setTimeout(()=>{video.removeEventListener('seeked',done);reject(Error('Video frame could not be decoded.'))},5000);video.addEventListener('seeked',done,{once:true});video.currentTime=time});if(s.closed)throw Error('Analysis cancelled')}
async function analyzeVideo(s){
 if(!Number.isFinite(video.duration)||video.duration>900)throw Error('Choose a video no longer than 15 minutes.');
 video.pause();let frame=0;const step=.1;
 while(!s.closed&&frame<=video.duration){
  if(s.paused){await new Promise(r=>setTimeout(r,100));continue}
  await seek(Math.min(frame,video.duration-.01),s);if(s.closed)return;s.sampleTime=video.currentTime*1000;s.pending=s.pose.send({image:video});await s.pending;
  $('analysisProgress').value=Math.min(100,100*frame/video.duration);$('analysisNote').textContent='Analyzed '+Math.floor(frame)+' / '+Math.floor(video.duration)+' seconds · '+s.tracker.reps+' reps';frame+=step;
 }
 if(!s.closed){s.analyzed=true;s.workout.state='complete';$('pauseSession').disabled=true;s.buddy.stop();voice.stop();$('analysisNote').textContent='Analysis complete. Review the repetitions and observed angles, then save.';$('analysisProgress').value=100;readout(s)}
}
$('fullscreen').onclick=()=>{const element=document.querySelector('.surface');if(document.fullscreenElement)document.exitFullscreen?.();else element.requestFullscreen?.().catch(()=>notify('Fullscreen is unavailable in this browser.'))};
let videoFile;
$('previewAnalyze').onclick=()=>{if(!videoFile)return;const file=videoFile;videoFile=null;$('videoPreview').pause();$('videoPreview').removeAttribute('src');$('videoPreviewDialog').close();startVision(file)};
async function previewFile(file){if(current)return;if((!file.type.startsWith('video/')&&!/\.(mp4|webm|mov|m4v)$/i.test(file.name))||file.size>150*1024*1024){notify('Choose a video under 150 MB in a browser-supported format.');return}videoFile=file;const url=URL.createObjectURL(file);$('videoPreview').src=url;$('videoPreviewDialog').showModal();$('videoPreviewDialog').onclose=()=>{$('videoPreview').pause();$('videoPreview').removeAttribute('src');$('videoPreview').load();videoFile=null;URL.revokeObjectURL(url)}}
$('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)previewFile(f)};
const drop=document.querySelector('.monitor');drop.ondragover=e=>e.preventDefault();drop.ondrop=e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)previewFile(f)};
setInterval(()=>{if(!current||current.closed)return;const s=current;store.setItem('kinarc.draft',JSON.stringify({exercise:s.exercise,side:s.side,goal:s.goal,sets:s.workout.config.sets,rest:s.workout.config.rest,reps:s.workout.total+(['complete','rest'].includes(s.workout.state)?0:s.tracker.reps),source:s.mode,savedAt:new Date().toISOString()}))},5000);
