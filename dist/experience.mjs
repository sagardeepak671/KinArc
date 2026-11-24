import {store} from './account-store.mjs';
import {exercises as catalog} from './exercises.mjs';
export {catalog};

const day=d=>[d.getFullYear(),d.getMonth(),d.getDate()].join('-');
export function activitySummary(rows,now=new Date()){
 const tracked=rows.filter(r=>['Camera','Video file'].includes(r.mode)&&r.reps>0&&Number.isFinite(Date.parse(r.date)));
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());start.setDate(start.getDate()-((start.getDay()+6)%7));
 const end=new Date(start);end.setDate(end.getDate()+7);
 const week=tracked.filter(r=>new Date(r.date)>=start&&new Date(r.date)<end);
 const days=new Set(tracked.map(r=>day(new Date(r.date))));let d=new Date(now),streak=0;
 if(!days.has(day(d)))d.setDate(d.getDate()-1);while(days.has(day(d))){streak++;d.setDate(d.getDate()-1)}
 return {weekDays:new Set(week.map(r=>day(new Date(r.date)))).size,weekReps:week.reduce((n,r)=>n+r.reps,0),streak,days,tracked};
}
export function setupExperience({read,profile,select,refresh}){
 const $=id=>document.getElementById(id);
 function update(){
  let rows;try{rows=read()}catch{rows=[]}
  const s=activitySummary(rows),goal=Number(store.getItem('kinarc.weeklyGoal.'+profile().id)||3);
  $('welcomeName').textContent=profile().name==='My workshop'?'Ready for your next session?':'Welcome back, '+profile().name+'.';
  document.querySelector('.home-stats').hidden=s.tracked.length===0;$('weekDays').textContent=s.weekDays+' / '+goal;$('weekReps').textContent=s.weekReps;$('homeStreak').textContent=s.streak+(s.streak===1?' day':' days');
  $('weeklyGoal').value=String(goal);$('weekProgress').max=goal;$('weekProgress').value=Math.min(goal,s.weekDays);
  $('homeGoalNote').textContent=s.weekDays>=goal?'Weekly practice goal reached. Keep your next session comfortable.':(goal-s.weekDays)+' more practice day'+(goal-s.weekDays===1?'':'s')+' toward your weekly goal.';
  const latest=[...s.tracked].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  $('continuePractice').textContent=latest?'Practice '+latest.exercise+' again':'Start your first session';
  $('continuePractice').onclick=()=>select(latest?.exercise||'Knee bend');
  $('lastSession').textContent=latest?latest.exercise+' · '+latest.reps+' reps · '+new Date(latest.date).toLocaleDateString():'Choose an exercise, preview the movement and set your target.';
  $('weekDots').replaceChildren();const now=new Date(),monday=new Date(now.getFullYear(),now.getMonth(),now.getDate());monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
  for(let i=0;i<7;i++){const d=new Date(monday);d.setDate(d.getDate()+i);const span=document.createElement('span');span.textContent=d.toLocaleDateString(undefined,{weekday:'short'});span.className=s.days.has(day(d))?'done':'';span.title=d.toLocaleDateString()+(span.className?' · practiced':' · no tracked practice');$('weekDots').append(span)}
  $('renameProfile').value=profile().name;
 }
 $('weeklyGoal').onchange=()=>{store.setItem('kinarc.weeklyGoal.'+profile().id,$('weeklyGoal').value);update()};
 $('renameForm').onsubmit=async e=>{e.preventDefault();const name=$('renameProfile').value.trim();if(!name)return;const members=JSON.parse(store.getItem('kinarc.members.v1'));if(members.some(m=>m.id!==profile().id&&m.name.toLowerCase()===name.toLowerCase())){$('renameStatus').textContent='That name is already in use.';return}const m=members.find(m=>m.id===profile().id);m.name=name;store.setItem('kinarc.members.v1',JSON.stringify(members));await store.flush();location.reload()};
 $('onboardingDismiss').onclick=()=>{$('gettingStarted').hidden=true;store.setItem('kinarc.onboarded','yes')};
 $('gettingStarted').hidden=store.getItem('kinarc.onboarded')==='yes';
 const filter=()=>{let n=0;for(const tile of $('shelf').children){const info=catalog[tile.dataset.exercise];tile.hidden=!((!$('exerciseSearch').value||tile.dataset.exercise.toLowerCase().includes($('exerciseSearch').value.toLowerCase()))&&($('exerciseArea').value==='All'||info.area===$('exerciseArea').value)&&($('exerciseLevel').value==='All'||info.level===$('exerciseLevel').value)&&($('exerciseEquipment').value==='All'||info.equipment===$('exerciseEquipment').value)&&($('favoriteFilter')?.dataset.active!=='yes'||JSON.parse(store.getItem('kinarc.favorites.'+profile().id)||'[]').includes(tile.dataset.exercise)));if(!tile.hidden)n++}$('shelfCount').textContent=n+' exercises';$('shelfEmpty').hidden=n!==0};
 for(const tile of $('shelf').children){const name=tile.querySelector('span').textContent;tile.dataset.exercise=name;const meta=document.createElement('small');meta.textContent=catalog[name].area+' · '+catalog[name].level;tile.append(meta);const desc=document.createElement('p');desc.textContent=catalog[name].desc;tile.append(desc)}
 $('exerciseSearch').oninput=filter;for(const id of ['exerciseArea','exerciseLevel','exerciseEquipment'])$(id).onchange=filter;filter();
 const presets={gentle:['Knee bend','Elbow curl','Mini squat'],upper:['Hammer curl','Front raise','Arm raise'],standing:['Mini squat','Standing hamstring curl','Hip hinge']};
 for(const button of document.querySelectorAll('[data-preset]'))button.onclick=()=>{const key='kinarc.routines.'+profile().id;const before=JSON.parse(store.getItem(key)||'[]');const name=button.textContent.split(' · ')[0];if(!before.some(r=>r.name===name))before.push({id:crypto.randomUUID(),name,weekdays:[1,3,5],items:presets[button.dataset.preset].map(exercise=>({id:crypto.randomUUID(),exercise,side:'left',goal:5,sets:1,rest:30}))});store.setItem(key,JSON.stringify(before));refresh();$('presetStatus').textContent='Added missing movements to your routine. Review the side and target before practice.'};
 return update;
}
