import {exercises} from './exercises.mjs';
import {Database} from './database.mjs';
// Local guest data keeps its existing keys. Each authenticated account gets its own namespace.
export function createStore(storage,uid=''){
 const prefix=uid?'account.'+encodeURIComponent(uid)+'.':'';
 return {
  getItem:key=>storage.getItem(prefix+key),setItem:(key,value)=>storage.setItem(prefix+key,value),
  removeItem:key=>storage.removeItem(prefix+key),
  keys:()=>Object.keys(storage).filter(k=>k.startsWith(prefix+'kinarc.')&&k!==prefix+'kinarc.accountScope').map(k=>k.slice(prefix.length))
 };
}
export let store=null;
export let database=null;
export async function initializeStore(uid='',storage=globalThis.localStorage,factory=globalThis.indexedDB){
 const legacy=createStore(storage,uid);const values=Object.fromEntries(legacy.keys().map(k=>[k,legacy.getItem(k)]));database=new Database(factory);await database.open(uid||'guest',values,validateSnapshot);store=database;return database;
}
export function snapshot(){return Object.fromEntries(store.keys().map(k=>[k,store.getItem(k)]))}
export function validateSnapshot(data){
 if(!data||Array.isArray(data)||typeof data!=='object')throw Error('Invalid backup data.');
 for(const [key,value] of Object.entries(data)){
  if(!/^kinarc\.[A-Za-z0-9._-]+$/.test(key)||key.length>300||key==='kinarc.accountScope'||typeof value!=='string')throw Error('Invalid backup key.');
  if(key==='kinarc.settings'){const settings=JSON.parse(value);if(!settings||typeof settings!=='object'||Array.isArray(settings))throw Error('Invalid settings in backup.');if(settings.theme&&!['light','dark','system'].includes(settings.theme))throw Error('Invalid theme.');for(const [name,min,max] of [['reps',1,100],['sets',1,10],['rest',0,300],['duration',1,60],['voiceRate',.5,1.5],['voiceVolume',0,1]])if(settings[name]!==undefined&&(!Number.isFinite(settings[name])||settings[name]<min||settings[name]>max))throw Error('Invalid setting '+name);}
  if(key.startsWith('kinarc.favorites.')){const favorites=JSON.parse(value);if(!Array.isArray(favorites)||favorites.some(name=>!exercises[name]))throw Error('Invalid favorites.');}
  if(key.startsWith('kinarc.weeklyGoal.')&&(!Number.isInteger(Number(value))||Number(value)<1||Number(value)>7))throw Error('Invalid weekly goal.');
  if(/^kinarc\.(members\.v1|sessions\.|routines?\.|routineHistory\.)/.test(key)){const list=JSON.parse(value);if(!Array.isArray(list))throw Error('Invalid list in backup.');const ids=list.filter(i=>i?.id).map(i=>i.id);if(new Set(ids).size!==ids.length)throw Error('Duplicate record IDs in backup.');
   if(key==='kinarc.members.v1'&&(!list.length||list.some(m=>!m||typeof m.id!=='string'||typeof m.name!=='string'||!m.name.trim()||m.name.length>80||!m.id||m.id.length>200||!/^[A-Za-z0-9_-]+$/.test(m.id))))throw Error('Invalid profile in backup.');
   if(key.includes('sessions')&&list.some(s=>!s||!Number.isFinite(Date.parse(s.date))||!Number.isFinite(s.reps)||s.reps<0||s.reps>100000||(s.seconds!==undefined&&(!Number.isFinite(s.seconds)||s.seconds<0||s.seconds>86400))||(s.note!==undefined&&(typeof s.note!=='string'||s.note.length>300))||(s.min!=null&&(!Number.isFinite(s.min)||s.min<0||s.min>180))||(s.max!=null&&(!Number.isFinite(s.max)||s.max<0||s.max>180))))throw Error('Invalid session in backup.');
   if(key.includes('routines.')&&list.some(r=>!r||typeof r.id!=='string'||typeof r.name!=='string'||!Array.isArray(r.items)||r.items.length>50||!Array.isArray(r.weekdays)||r.weekdays.some(d=>!Number.isInteger(d)||d<0||d>6)||r.items.some(i=>!i||typeof i.id!=='string'||typeof i.exercise!=='string'||!Number.isInteger(i.goal)||i.goal<1||i.goal>100||!exercises[i.exercise]||!['left','right'].includes(i.side)||(i.sets!==undefined&&(!Number.isInteger(i.sets)||i.sets<1||i.sets>10))||(i.rest!==undefined&&(!Number.isFinite(i.rest)||i.rest<0||i.rest>300)))))throw Error('Invalid named routine in backup.');
   if(key.includes('routine.')&&list.some(i=>!i||typeof i.id!=='string'||typeof i.exercise!=='string'||!Number.isFinite(i.goal)))throw Error('Invalid routine in backup.');
  }
 }
 if(!data['kinarc.members.v1'])throw Error('The backup contains no profiles.');
 if(new TextEncoder().encode(JSON.stringify(data)).length>10000000)throw Error('Backup exceeds 10 MB. Export a local file instead.');
 return data;
}
export async function restoreSnapshot(data){validateSnapshot(data);await database.replace({...data,'kinarc.sync.enabled':'no'})}
