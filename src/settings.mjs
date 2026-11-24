import {store} from './account-store.mjs';
export const defaults={theme:'system',voiceRate:.94,voiceVolume:.8,voiceName:'',reps:5,sets:1,rest:30,side:'left',camera:'user',skeleton:true,reducedMotion:false,duration:10};
export function preferences(){const theme=store?.getItem('kinarc.theme'),volume=Number(store?.getItem('kinarc.coachVolume')??defaults.voiceVolume),legacy={theme:['light','dark','system'].includes(theme)?theme:defaults.theme,voiceVolume:Number.isFinite(volume)&&volume>=0&&volume<=1?volume:defaults.voiceVolume};try{return {...defaults,...legacy,...JSON.parse(store?.getItem('kinarc.settings')||'{}')}}catch{return {...defaults,...legacy}}}
export function savePreferences(value){const next={...preferences(),...value};store.setItem('kinarc.settings',JSON.stringify(next));document.dispatchEvent(new CustomEvent('kinarc-settings',{detail:next}));return next}
export function applyPreferences(p=preferences()){
 document.documentElement.dataset.theme=p.theme==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):p.theme;document.documentElement.dataset.motion=p.reducedMotion?'reduced':'full';
 for(const [id,value] of Object.entries({goal:p.reps,sets:p.sets,restSeconds:p.rest,side:p.side,cameraFacing:p.camera,coachVolume:p.voiceVolume})){const el=document.getElementById(id);if(el&&!el.disabled){if(id==='goal'&&![...el.options].some(o=>o.value===String(value)))el.add(new Option(String(value),String(value)));el.value=value}}
 const sk=document.getElementById('skeletonToggle');if(sk)sk.checked=p.skeleton;
 const color=document.querySelector('meta[name=theme-color]');if(color)color.content=document.documentElement.dataset.theme==='dark'?'#151c19':'#f5f5f1';
 const t=document.getElementById('theme');if(t)t.textContent=document.documentElement.dataset.theme==='dark'?'Light mode':'Dark mode';
}
