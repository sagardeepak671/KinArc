import {initIdentity,logout} from './auth-service.mjs';
import {initializeStore,createStore} from './account-store.mjs';
let identity;const $=id=>document.getElementById(id);let started=false;
async function start(user=null){
 if(started)return;started=true;
 try{
  await initializeStore(user?.uid||'');
  await import('./app.js');await import('./web-app.mjs');await import('./trial.mjs');await import('./product.mjs');await import('./account.mjs');
  document.body.classList.remove('booting');$('bootScreen').hidden=true;
  if(identity?.auth){let first=true;identity.f.onAuthStateChanged(identity.auth,next=>{if(first){first=false;return}if((next?.uid||'')!==(user?.uid||'')){window.kinarc?.stop();document.body.classList.add('booting');location.reload()}})}
  const channel=new BroadcastChannel('kinarc-identity');channel.onmessage=async e=>{if(e.data?.type==='signout'&&e.data.uid===user?.uid&&user){window.kinarc?.stop();document.body.classList.add('booting');await logout();location.reload()}};
 }catch(error){started=false;$('bootMessage').textContent='Could not open your saved workspace: '+error.message;$('bootRetry').hidden=false;if(!document.getElementById('bootRecovery')){const exportButton=document.createElement('button');exportButton.id='bootRecovery';exportButton.textContent='Download original recovery data';exportButton.onclick=()=>{const legacy=createStore(localStorage,user?.uid||'');const data=Object.fromEntries(legacy.keys().map(k=>[k,legacy.getItem(k)]));const url=URL.createObjectURL(new Blob([JSON.stringify({format:'kinarc-recovery',version:1,data},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kinarc-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('bootScreen').append(exportButton)}}
}
$('bootGuest').onclick=()=>start();$('bootRetry').onclick=()=>location.reload();
try{identity=await initIdentity();await start(identity.user)}catch(error){$('bootMessage').textContent=error.message+' Your account data has not been opened.';$('bootGuest').hidden=$('bootRetry').hidden=false;if(!document.getElementById('bootRecovery')){const exportButton=document.createElement('button');exportButton.id='bootRecovery';exportButton.textContent='Download original recovery data';exportButton.onclick=()=>{const legacy=createStore(localStorage,user?.uid||'');const data=Object.fromEntries(legacy.keys().map(k=>[k,legacy.getItem(k)]));const url=URL.createObjectURL(new Blob([JSON.stringify({format:'kinarc-recovery',version:1,data},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kinarc-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('bootScreen').append(exportButton)}}
