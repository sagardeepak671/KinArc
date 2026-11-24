import {ask} from './ui.mjs';
import {askName} from './plan.mjs';
const $=id=>document.getElementById(id);
const regular=r=>r.mode==='Camera'||r.mode==='Video file';
const total=(rows,key)=>rows.reduce((n,r)=>n+(Number(r[key])||0),0);
const moveDay=(date,n)=>new Date(date.getFullYear(),date.getMonth(),date.getDate()+n);
const dayKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const dateLabel=d=>d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
const duration=s=>s>=3600?Math.floor(s/3600)+'h '+Math.floor(s%3600/60)+'m':Math.floor(s/60)+'m '+s%60+'s';
export function bounds(date,unit){
  if(unit==='all')return {start:new Date(1970,0,1),end:moveDay(new Date(),1)};
  let start=moveDay(date,0);
  if(unit==='week')start=moveDay(start,-((start.getDay()+6)%7));
  if(unit==='month')start.setDate(1);
  const end=unit==='month'?new Date(start.getFullYear(),start.getMonth()+1,1):moveDay(start,unit==='week'?7:1);
  return {start,end};
}
function node(tag,value){const e=document.createElement(tag);e.textContent=value;return e}
const name=r=>r.exercise||'Knee bend';
function csv(rows){
  const fields=['Date','Exercise','Source','Side','Reps','Target per set','Planned sets','Completed sets','Duration (seconds)','Minimum angle','Maximum angle','Session note'];
  const values=rows.map(r=>[r.date,name(r),r.mode,r.side,r.reps,r.goal,r.setsPlanned||1,r.setsCompleted??'',r.seconds,r.min,r.max,r.note]);
  return [fields,...values].map(row=>row.map(v=>'"'+String(v??'').replace(/^(\s*[=+@-])/,"'$1").replaceAll('"','""')+'"').join(',')).join('\r\n')
}
export function setupReport(read,profile,write){
  let visible=[],range,page=0;const pageSize=25;
  const pager=node('div','');pager.className='report-nav';const prevPage=node('button','Previous entries'),nextPage=node('button','Next entries'),pageInfo=node('span','');pager.append(prevPage,pageInfo,nextPage);$('records').after(pager);prevPage.onclick=()=>{page--;render()};nextPage.onclick=()=>{page++;render()};
  $('reportDate').value=dayKey(new Date());
  for(const opt of $('exercise').options)$('reportExercise').add(new Option(opt.value));
  const unit=()=>$('period').value;
  function shift(n){
    const {start,end}=range;
    $('reportDate').value=dayKey(n<0?moveDay(start,-1):end);render()
  }
  $('prevPeriod').onclick=()=>shift(-1);$('nextPeriod').onclick=()=>shift(1);
  $('todayPeriod').onclick=()=>{$('reportDate').value=dayKey(new Date());render()};
  for(const id of ['period','reportDate','reportSource','reportExercise','historySearch'])$(id).onchange=render;
  $('exportReport').onclick=()=>{
    const url=URL.createObjectURL(new Blob(['\ufeff',csv(visible)],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=profile()+'-'+dayKey(range.start)+'-'+unit()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)
  };
  $('historySearch').oninput=()=>{page=0;render()};
  function render(){
    const input=$('reportDate');if(!input.value)input.value=dayKey(new Date());
    range=bounds(new Date(input.value+'T00:00:00'),unit());
    const {start,end}=range;
    let rows;try{rows=read().filter(r=>r&&Number.isFinite(Date.parse(r.date)))}catch{rows=null}
    const source=$('reportSource').value,exercise=$('reportExercise').value;
    const filtered=(rows||[]).filter(r=>(source==='all'||(source==='tracked')===regular(r))&&(exercise==='All exercises'||name(r)===exercise)&&(!($('historySearch')?.value)||((r.note||'')+' '+name(r)).toLowerCase().includes($('historySearch').value.toLowerCase())));
    const within=(a,b)=>filtered.filter(r=>{const t=Date.parse(r.date);return t>=a&&t<b});
    visible=within(start,end).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
    const prev=bounds(moveDay(start,-1),unit()),past=within(prev.start,prev.end);
    const practiceDays=new Set(visible.map(r=>dayKey(new Date(r.date)))).size;
    const reps=total(visible,'reps'),delta=reps-total(past,'reps');
    const goals=visible.filter(r=>r.goal>0),met=goals.filter(r=>r.reps>=r.goal*(r.setsPlanned||1)&&(r.setsCompleted??1)>=(r.setsPlanned||1)).length;
    const active=new Set((rows||[]).filter(r=>regular(r)&&r.reps>0).map(r=>dayKey(new Date(r.date))));
    let d=new Date(),streak=0;if(!active.has(dayKey(d)))d=moveDay(d,-1);
    while(active.has(dayKey(d))){streak++;d=moveDay(d,-1)}
    $('rangeTitle').textContent=unit()==='all'?'All saved activity':unit()==='day'?dateLabel(start):dateLabel(start)+' – '+dateLabel(moveDay(end,-1));
    $('reportSummary').textContent=!rows?'History could not be read in this browser.':!visible.length?'No matching sessions for this period. Choose another date or session source.':visible.length+' saved session'+(visible.length===1?'':'s')+' across '+practiceDays+' practice day'+(practiceDays===1?'':'s')+'. '+(unit()==='all'?'All-time totals.':delta===0?'Same rep total as the previous '+unit()+'.':Math.abs(delta)+' '+(delta>0?'more':'fewer')+' reps than the previous '+unit()+'.');
    const metrics=$('metrics');metrics.replaceChildren();
    for(const [label,value] of [['Reps',reps],['Session time',duration(total(visible,'seconds'))],['Targets met',goals.length?met+' / '+goals.length:'—'],['Current tracked streak',streak+'d']]){
      const card=node('div','');card.append(node('small',label),node('strong',value));metrics.append(card)
    }
    const daily=unit()==='day',buckets=[];
    if(unit()==='all'){for(let i=11;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i,1);buckets.push({label:d.toLocaleDateString(undefined,{month:'short',year:'2-digit'}),month:d.getFullYear()*12+d.getMonth(),reps:0})}}
    else if(daily){for(let h=0;h<24;h+=3)buckets.push({label:String(h).padStart(2,'0')+'h',reps:0})}
    else for(let day=start;day<end;day=moveDay(day,1))buckets.push({label:unit()==='week'?day.toLocaleDateString(undefined,{weekday:'short'}):String(day.getDate()),reps:0});
    for(const r of visible){const day=new Date(r.date);const i=unit()==='all'?buckets.findIndex(b=>b.month===day.getFullYear()*12+day.getMonth()):daily?Math.floor(day.getHours()/3):unit()==='month'?day.getDate()-1:(day.getDay()+6)%7;if(buckets[i])buckets[i].reps+=Number(r.reps)||0}
    const peak=Math.max(1,...buckets.map(b=>b.reps));
    $('chartNote').textContent=unit()==='all'?'Monthly repetitions during the last 12 months (totals include all history)':daily?'Reps by three-hour block, local time':'Reps per calendar day';
    const bars=$('bars');bars.replaceChildren();
    for(const b of buckets){
      const col=node('div',''),bar=node('i','');bar.style.height=(b.reps/peak*85)+'px';
      col.title=b.label+' · '+b.reps+' reps';col.setAttribute('aria-label',col.title);
      col.append(node('small',b.reps||'·'),bar,node('span',b.label));bars.append(col)
    }
    const breakdown=$('breakdown');breakdown.replaceChildren();
    const groups=Map.groupBy?Map.groupBy(visible,name):visible.reduce((m,r)=>m.set(name(r),[...(m.get(name(r))||[]),r]),new Map());
    for(const [exercise,group] of [...groups].sort((a,b)=>total(b[1],'reps')-total(a[1],'reps'))){
      const line=node('div','');line.append(node('b',exercise),node('small',total(group,'reps')+' reps · '+group.length+' session'+(group.length===1?'':'s')+' · '+duration(total(group,'seconds'))));const share=document.createElement('progress');share.max=Math.max(1,reps);share.value=total(group,'reps');share.setAttribute('aria-label',exercise+' share of period reps');line.append(share);breakdown.append(line)
    }
    if(!visible.length)breakdown.textContent='No exercises recorded in this selection.';
    const log=$('records');log.replaceChildren();$('exportReport').disabled=!visible.length;
    page=Math.min(Math.max(0,page),Math.max(0,Math.ceil(visible.length/pageSize)-1));prevPage.disabled=page===0;nextPage.disabled=(page+1)*pageSize>=visible.length;pageInfo.textContent=visible.length?'Entries '+(page*pageSize+1)+'–'+Math.min(visible.length,(page+1)*pageSize)+' of '+visible.length:'No entries';
    for(const r of visible.slice(page*pageSize,(page+1)*pageSize)){
      const line=node('div','');line.className='entry';
      for(const [value,detail] of [[name(r),new Date(r.date).toLocaleString()+' · '+r.mode+(r.side?' · '+r.side:'')],[r.reps+(r.goal?' / '+r.goal*(r.setsPlanned||1):'')+' reps',duration(r.seconds)],[r.min==null?'—':r.min+'° – '+r.max+'°','Observed joint angle']]){
        const cell=node('div',value);cell.append(node('small',detail));line.append(cell)
      }if(r.note){const note=node('p',r.note);note.className='session-note';line.append(note)}if(write){
        const actions=node('div','');actions.className='history-actions';
        const edit=node('button','Edit note');edit.onclick=async()=>{const note=await askName('Edit session note',r.note||'');if(note===null)return;try{const all=read(),i=all.findIndex(x=>r.id?x.id===r.id:x.date===r.date&&x.exercise===r.exercise);if(i<0)return;all[i]={...all[i],note:note.slice(0,300)};await write(all);render()}catch{$('historyAction').textContent='Could not save the note. Export a backup and check browser storage.'}};
        const remove=node('button','Remove entry');remove.onclick=async()=>{if(!await ask('Remove session?', 'This removes the selected session. You can undo immediately after removal.',{confirm:'Remove entry',danger:true}))return;try{const all=read(),i=all.findIndex(x=>r.id?x.id===r.id:x.date===r.date&&x.exercise===r.exercise);if(i<0)return;const [removed]=all.splice(i,1);await write(all);render();const status=$('historyAction');status.replaceChildren(document.createTextNode('Entry removed. '));const undo=node('button','Undo');undo.onclick=async()=>{try{const next=read();next.splice(Math.min(i,next.length),0,removed);await write(next);render();status.textContent='Entry restored.'}catch{status.textContent='Could not restore the entry. Check browser storage.'}};status.append(undo)}catch{$('historyAction').textContent='Could not remove the entry.'}};
        const detail=node('button','Session details');detail.onclick=()=>showSession(r);actions.append(detail,edit,remove);line.append(actions)
      }log.append(line)
    }
    if(!visible.length)log.textContent='No session entries.';
  }
  return render;
}

function showSession(row){
 const d=document.createElement('dialog');d.className='session-detail';d.setAttribute('aria-label',row.exercise+' session details');d.append(node('div',row.mode,'kicker'),node('h2',row.exercise),node('p',new Date(row.date).toLocaleString()+' · '+row.side+' side'),node('p',row.reps+' reps · '+(row.setsCompleted||0)+' completed sets · '+duration(row.seconds)),node('p','Observed angle range: '+row.min+'°–'+row.max+'°. These are projected estimates, not a clinical score.'));
 if(row.note)d.append(node('p',row.note));
 if(row.timeline?.length){const points=row.timeline.filter(p=>Number.isFinite(p.time)&&Number.isFinite(p.angle));if(points.length){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 600 190');svg.setAttribute('role','img');svg.setAttribute('aria-label','Observed joint angle across video time');const line=document.createElementNS(svg.namespaceURI,'polyline');const last=Math.max(1,points.at(-1).time);line.setAttribute('points',points.map(p=>(p.time/last*580+10)+','+(180-p.angle)).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','2');svg.append(line);d.append(node('h3','Video movement timeline'),svg);const details=document.createElement('details');details.append(node('summary','Read timeline measurements'));const table=document.createElement('table');const header=document.createElement('tr');['Video time','Angle','Reps so far'].forEach(t=>header.append(node('th',t)));table.append(header);for(const p of points.filter((_,i)=>i%Math.max(1,Math.floor(points.length/50))===0)){const tr=document.createElement('tr');[p.time+'s',p.angle+'°',p.reps].forEach(t=>tr.append(node('td',t)));table.append(tr)}details.append(table);d.append(details)}}
 const close=node('button','Close details');close.onclick=()=>{d.close();d.remove()};d.oncancel=()=>d.remove();d.append(close);document.body.append(d);d.showModal();
}
