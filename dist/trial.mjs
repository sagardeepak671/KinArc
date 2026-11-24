import {baseExercise} from './exercise-types.mjs';
import {portrait} from './character.mjs';
import {lessons} from './lessons.mjs';
const get=id=>document.getElementById(id);
const dialog=get('lesson'), audio=get('voice'), ctx=get('figure').getContext('2d');
let exercise, side, lesson, frame,manualTime=null;

function render(){
 const t=manualTime??audio.currentTime, stages=lesson.stages;
 const i=stages.findLastIndex(s=>s.at<=t);
 const fraction=Math.min(1,(t-stages[i].at)/1.35);
 const smooth=fraction*fraction*(3-2*fraction);
 const progress=i===1?smooth:i===2?1-smooth:0;
 const angle=baseExercise(exercise)==='Arm raise'?8+76*progress:168-(exercise==='Mini squat'?30:baseExercise(exercise)==='Elbow curl'?124:78)*progress;
 portrait(ctx,exercise,side,angle);
 const caption=stages[i].text;if(get('caption').textContent!==caption)get('caption').textContent=caption;
 get('phase').textContent=['Starting position','Move','Return','Complete'][i]+'   ·   '+(i===3||i===2&&fraction===1?'1 / 1 rep':'0 / 1 rep');
}
function tick(){render();if(!audio.paused)frame=requestAnimationFrame(tick)}
audio.onplay=()=>{if(audio.paused)return;manualTime=null;cancelAnimationFrame(frame);tick()};audio.onseeked=audio.onended=()=>{if(dialog.open)render()};
get('trial').onclick=()=>{
 manualTime=null;exercise=get('exercise').value;side=get('side').value;lesson=lessons[exercise];
 get('lessonTitle').textContent=exercise+' · '+side;audio.src=lesson.file;dialog.showModal();render();
 audio.play().catch(()=>{if(dialog.open)get('caption').textContent='Press Play below to start the narrated trial.'})
};
dialog.onclose=()=>{audio.pause();cancelAnimationFrame(frame)};
get('trialSpeed').onchange=()=>{audio.playbackRate=Number(get('trialSpeed').value)};
get('trialLoop').onchange=()=>{audio.loop=get('trialLoop').checked};
get('trialNarration').onchange=()=>{audio.muted=!get('trialNarration').checked};
get('trialRestart').onclick=()=>{manualTime=null;audio.currentTime=0;audio.play().catch(()=>{});render()};
function step(direction){audio.pause();cancelAnimationFrame(frame);const i=Math.max(0,lesson.stages.findLastIndex(s=>s.at<=(manualTime??audio.currentTime)));manualTime=lesson.stages[Math.max(0,Math.min(3,i+direction))].at+.01;const seek=()=>{audio.currentTime=manualTime};if(audio.readyState>=1)seek();else audio.addEventListener('loadedmetadata',seek,{once:true});render()}
get('trialPrev').onclick=()=>step(-1);get('trialNext').onclick=()=>step(1);
