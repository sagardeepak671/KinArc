import {ask} from './ui.mjs';
import {store, snapshot, restoreSnapshot} from './account-store.mjs';
const get=id=>document.getElementById(id),status=get('appStatus');
let installPrompt;
const standalone=matchMedia('(display-mode: standalone)').matches;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(!standalone)get('installApp').hidden=false});
get('installApp').onclick=async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;get('installApp').hidden=true};
window.addEventListener('appinstalled',()=>{get('installApp').hidden=true});
function network(){status.textContent=navigator.onLine?'':'Offline · downloaded exercises and saved journals remain available.'}
addEventListener('online',network);addEventListener('offline',network);network();
if('serviceWorker' in navigator&&window.isSecureContext){
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    const offer=()=>{if(!reg.waiting)return;status.replaceChildren(document.createTextNode('An updated KinArc is ready. Finish your session, then reload. '));const b=document.createElement('button');b.textContent='Update app';b.onclick=()=>{if(!get('active').hidden){status.firstChild.textContent='Finish or discard your session before updating. ';return}reg.waiting.postMessage('activate')};status.append(b)};
    offer();reg.addEventListener('updatefound',()=>{const w=reg.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)offer()})});
  }).catch(()=>{status.textContent='Offline installation is unavailable. You can continue online.'});
  let controlled=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled){if(window.kinarc?.active()){status.textContent='An app update is ready. Finish your session, then reload.'}else location.reload()}controlled=true});
}
const mode=get('coachMode');mode.value=store.getItem('kinarc.coachMode')||'device';
function voiceStatus(){get('voiceStatus').textContent=mode.value==='local'?'Generative coaching requires the local Mac server. It is unavailable on a static deployment.':'Device speech uses supported movement checks. It does not use a generative AI service.'}
mode.addEventListener('change',()=>{store.setItem('kinarc.coachMode',mode.value);voiceStatus()});voiceStatus();
get('backupData').onclick=()=>{
 const data={format:'kinarc-backup',version:1,created:new Date().toISOString(),data:{}};
 for(const key of store.keys())if(key.startsWith('kinarc.'))data.data[key]=store.getItem(key);
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kinarc-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);get('dataStatus').textContent='Backup exported. Keep it private: it includes all profiles and exercise histories.';
};
get('restoreData').onclick=()=>get('backupFile').click();
get('backupFile').onchange=async e=>{
 try{
  const file=e.target.files[0];if(!file)return;if(file.size>10000000)throw Error('Backup is too large.');
  const backup=JSON.parse(await file.text());if(backup.format!=='kinarc-backup'||backup.version!==1||!backup.data||typeof backup.data!=='object')throw Error('Choose a KinArc backup.');
  const entries=Object.entries(backup.data);for(const [k,v] of entries){if(!k.startsWith('kinarc.')||typeof v!=='string')throw Error('Invalid backup entry.');if(/members|sessions|routine/.test(k))JSON.parse(v)}
  const members=JSON.parse(backup.data['kinarc.members.v1']||'null');
  if(!Array.isArray(members)||!members.length||members.some(m=>!m||typeof m.id!=='string'||typeof m.name!=='string'))throw Error('Invalid profiles in backup.');
  if(!await ask('Restore backup?','Replace this workspace with the selected backup? Export your current data first to keep it.',{confirm:'Restore backup',danger:true}))return;
  await restoreSnapshot(backup.data);
  location.reload();
 }catch(error){get('dataStatus').textContent='Restore failed: '+error.message}finally{e.target.value=''}
};

async function offlineStatus(){if(!('serviceWorker' in navigator))return;const reg=await navigator.serviceWorker.ready;(reg.active||navigator.serviceWorker.controller)?.postMessage({type:'status'})}
navigator.serviceWorker?.addEventListener('message',e=>{const value=e.data;if(value.type==='download-progress'){document.getElementById('offlineProgress').value=Math.round(value.done/value.total*100);document.getElementById('offlineStatus').textContent=value.done+' / '+value.total+' files available offline.'}if(value.type==='download-complete'){document.getElementById('offlineStatus').textContent='All exercise files are available offline.'}if(value.type==='download-error'){document.getElementById('offlineStatus').textContent='Download interrupted. Retry when connected; completed files are kept.'}});
document.getElementById('downloadOffline').onclick=async()=>{document.getElementById('offlineStatus').textContent='Downloading exercise assets. Keep this page open…';const reg=await navigator.serviceWorker.ready;reg.active?.postMessage({type:'download'})};offlineStatus();
