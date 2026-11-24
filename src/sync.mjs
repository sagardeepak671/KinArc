import {cloudEnabled} from './firebase-config.mjs';
import {emulator} from './auth-service.mjs';
import {database,validateSnapshot} from './account-store.mjs';
import {project} from './database.mjs';
import {notify,ask,textElement} from './ui.mjs';
export function decideSync(local,remote){if(!local)return 'download';if(!remote)return local.baseRevision?'conflict':'upload';if(local.revision===remote.revision)return 'ack';if(typeof local.value==='string'&&local.value===remote.value&&local.deleted===remote.deleted&&local.order===remote.order)return 'download';if(!local.pending)return 'download';return local.baseRevision===remote.revision?'upload':'conflict'}
const eligible=r=>!/^kinarc\.(sync|draft|onboarding|chat)/.test(r.key);
export function validRecord(r){return r&&typeof r.id==='string'&&r.id.length<1000&&typeof r.key==='string'&&r.key.startsWith('kinarc.')&&r.key!=='kinarc.accountScope'&&typeof r.value==='string'&&r.value.length<100000&&typeof r.revision==='string'&&r.revision.length<65&&typeof r.deleted==='boolean'&&Number.isFinite(r.updatedAt)&&Number.isFinite(r.order)}
export async function setupSync(client){
 const root=document.createElement('article');root.className='data-tools';const h=textElement('h3','Cloud synchronization');const state=textElement('p','Sign in to use optional cross-device synchronization.');root.append(h,state);document.getElementById('profiles').append(root);
 if(!client?.user)return;
 if(!cloudEnabled&&!emulator){state.textContent='Cloud synchronization is unavailable for this project. Local history and file backups work normally.';return}
 const {f,db,user}=client;const key='kinarc.sync.enabled';
 if(database.getItem(key)==null){database.setItem(key,'yes');await database.flush()}
 const toggle=document.createElement('button');toggle.textContent=database.getItem(key)==='yes'?'Disable sync':'Enable cloud sync';const now=textElement('button','Sync now');const conflicts=document.createElement('div');const erase=textElement('button','Delete KinArc cloud contents');root.append(toggle,now,erase,conflicts);let running=false,timer,remoteCache,unsubscribe,remoteDirty=false;
 function status(text){state.textContent=text}
 const col=f.collection(db,'kinarcV2',user.uid,'records'),ref=id=>f.doc(col,encodeURIComponent(id));
 async function apply(row){const all=new Map(database.records);all.set(row.id,row);const data=project([...all.values()]);validateSnapshot(data);await database.transaction([row])}
 async function cycle(){
  if(running||database.getItem(key)!=='yes'||!navigator.onLine)return;running=true;now.disabled=true;conflicts.replaceChildren();status('Synchronizing…');
 let downloaded=false;
  try{
   await database.flush();const remoteDocs=remoteCache||await f.getDocs(col);const remote=new Map(remoteDocs.docs.map(d=>[decodeURIComponent(d.id),d.data()]));const ids=new Set([...database.records.keys(),...remote.keys()]);let count=0;
   for(const id of ids){if(database.getItem(key)!=='yes')break;const local=database.records.get(id),other=remote.get(id);if(!eligible(local||other))continue;if(other&&!validRecord(other))throw Error('Cloud record validation failed');const action=decideSync(local,other);
    if(action==='download'){await apply({...other,pending:false,baseRevision:other.revision});downloaded=true;continue}
    if(action==='ack'){if(local.pending)await database.transaction([{...local,pending:false,baseRevision:local.revision}]);continue}
    if(action==='upload'){
     const value={id:local.id,key:local.key,value:local.value,order:local.order,revision:local.revision,baseRevision:local.baseRevision||null,deleted:local.deleted,updatedAt:local.updatedAt};
     await f.runTransaction(db,async tx=>{const latest=await tx.get(ref(id));const head=latest.exists()?latest.data():null;if(decideSync(local,head)!=='upload'&&head?.revision!==local.revision)throw Error('Another device changed this record. Retry to review the conflict.');tx.set(ref(id),value)});
     const current=database.records.get(id);if(current?.revision===local.revision)await database.transaction([{...local,pending:false,baseRevision:local.revision}]);else if(current&&current.baseRevision===local.baseRevision)await database.transaction([{...current,baseRevision:local.revision}]);continue;
    }
    count++;const box=document.createElement('div');box.className='conflict';box.append(textElement('p','Both devices changed '+(local?.key||other?.key)+'. Choose the version to keep. Export a backup first if needed.'));
    for(const [label,choice] of [['Keep this device',local],['Use cloud version',other]]){const b=textElement('button',label);b.onclick=async()=>{try{if(!choice)return;const selected=label==='Keep this device'?{...local,baseRevision:other?.revision||null,pending:true}:{...other,baseRevision:other.revision,pending:false};await apply(selected);box.remove();await cycle()}catch(e){status(e.message)}};box.append(b)}conflicts.append(box);
   }
   if(database.getItem(key)!=='yes'){status('Sync disabled. A request already sent may finish; no further records will be uploaded.');return}
   if(count)status(count+' conflict(s) need your choice.');else{database.setItem('kinarc.sync.last',new Date().toISOString());await database.flush();status(downloaded?'Account data restored. Loading…':'Synced '+new Date().toLocaleString()+'.');if(downloaded){const marker='kinarc.cloudReload.'+user.uid;if(!sessionStorage.getItem(marker)){sessionStorage.setItem(marker,'yes');setTimeout(()=>location.reload(),150)}}}
  }catch(e){status('Sync paused: '+e.message+'. Local changes are retained. Retry when connected.')}finally{running=false;now.disabled=false;if(remoteDirty){remoteDirty=false;setTimeout(cycle,100)}}
 }
 erase.onclick=async()=>{if(!await ask('Delete KinArc cloud contents?','This replaces this version’s cloud records with empty deletion markers. Local data is kept and sync is disabled; export a backup before continuing. This does not delete your Google account or another app’s data.',{confirm:'Delete cloud contents',danger:true}))return;database.setItem(key,'no');await database.flush();unsubscribe?.();unsubscribe=null;toggle.textContent='Enable cloud sync';try{const docs=await f.getDocs(col);for(const doc of docs.docs){await f.runTransaction(db,async tx=>{const fresh=await tx.get(doc.ref);if(!fresh.exists())return;const row=fresh.data();tx.set(doc.ref,{...row,value:'',deleted:true,baseRevision:row.revision,revision:crypto.randomUUID(),updatedAt:Date.now()})})}status('KinArc cloud contents deleted. Empty markers remain to propagate deletion. Local data is retained; export it before re-enabling sync.')}catch(error){status('Cloud deletion incomplete: '+error.message+'. Sync remains disabled. Retry when connected.')}};
 function listen(){if(unsubscribe||database.getItem(key)!=='yes')return;unsubscribe=f.onSnapshot(col,snap=>{remoteCache=snap;if(running)remoteDirty=true;else cycle()},error=>status('Cloud listener paused: '+error.message))}
 now.onclick=()=>{remoteCache=null;cycle()};toggle.onclick=async()=>{if(database.getItem(key)==='yes'){database.setItem(key,'no');unsubscribe?.();unsubscribe=null;toggle.textContent='Enable cloud sync';status('Sync disabled. Existing cloud records are retained.')}else if(await ask('Enable cloud synchronization?','Profiles, routines, exercise records and notes will be sent to your Firebase account. Camera footage is never sent. Conflicting edits require your choice.',{confirm:'Enable sync'})){database.setItem(key,'yes');toggle.textContent='Disable sync';listen();await cycle()}};
 database.listeners.add(()=>{if(database.getItem(key)!=='yes'){unsubscribe?.();unsubscribe=null;return}if([...database.records.values()].some(r=>r.pending&&eligible(r))){clearTimeout(timer);timer=setTimeout(cycle,2500)}});addEventListener('online',()=>{listen();cycle()});listen();status(database.getItem(key)==='yes'?'Sync enabled. Checking changes…':'Sync is off. Your workspace stays on this device.');await cycle();
}
