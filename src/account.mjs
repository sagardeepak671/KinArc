import {identity,login,logout} from './auth-service.mjs';
import {database,snapshot,restoreSnapshot,validateSnapshot} from './account-store.mjs';
import {notify,ask} from './ui.mjs';
import {setupSync} from './sync.mjs';
const $=id=>document.getElementById(id),c=identity();
$('accountIdentity').textContent=c?.user?`${c.user.displayName||'KinArc member'} · ${c.user.email||'Google account'}`:'Guest workspace · saved on this device';
$('accountStatus').textContent=c?.user?'Signed in. Local workspace ready. Cloud synchronization is optional.':c?'Continue as a guest or sign in with Google.':'Google sign-in is unavailable. Guest features remain available.';
$('googleLogin').hidden=!!c?.user;$('googleLogin').disabled=!c;$('accountLogout').hidden=!c?.user;
$('googleLogin').onclick=async()=>{if(window.kinarc?.active())return notify('Finish or discard your workout first.');$('googleLogin').disabled=true;try{await login();location.reload()}catch(error){notify(error.code==='auth/unauthorized-domain'?'Authorize this hostname in Firebase Authentication settings.':error.code==='auth/popup-blocked'?'Allow the sign-in popup and retry.':'Sign-in cancelled or unavailable. Try again.');$('googleLogin').disabled=false}};
$('accountLogout').onclick=async()=>{if(window.kinarc?.active())return notify('Finish or discard your workout first.');await database.flush();await logout();new BroadcastChannel('kinarc-identity').postMessage({type:'signout',uid:c.user.uid});location.reload()};

await setupSync(c);
if(c?.user){
 const migrate=document.createElement('button');migrate.textContent='Import guest profiles into this account';document.querySelector('.account-panel').append(migrate);
 migrate.onclick=async()=>{
  if(window.kinarc?.active())return notify('Finish or discard your workout first.');
  if(!await ask('Import guest workspace?','Guest profiles will be copied as separate profiles in this account. Existing account data is kept; cloud sync will be turned off until you explicitly enable it again.',{confirm:'Import guest profiles'}))return;
  try{
   const {Database}=await import('./database.mjs');const {createStore}=await import('./account-store.mjs');const guestStorage=createStore(localStorage);const guest=await new Database().open('guest',Object.fromEntries(guestStorage.keys().map(k=>[k,guestStorage.getItem(k)])),validateSnapshot);
   const source=guest.cache,target=snapshot(),existing=JSON.parse(target['kinarc.members.v1']||'[]'),incoming=JSON.parse(source['kinarc.members.v1']||'[]');let added=0;
   for(const profile of incoming){const id='guest-'+profile.id;if(existing.some(p=>p.id===id))continue;existing.push({...profile,id,name:profile.name+' (guest)'});added++;
    for(const [key,value] of Object.entries(source)){let next=key==='kinarc.sessions.v1'&&profile.id==='original'?'kinarc.sessions.'+id:key.endsWith('.'+profile.id)?key.slice(0,-profile.id.length)+id:null;if(next)target[next]=value}
   }
   guest.close();if(!added)return notify('These guest profiles have already been imported, or the guest workspace is empty.');target['kinarc.members.v1']=JSON.stringify(existing);await restoreSnapshot(target);location.reload();
  }catch(error){notify('Guest import failed: '+error.message+'. Both original workspaces are retained.')}
 };
}

const erase=document.createElement('button');erase.type='button';erase.textContent='Erase this workspace from this device';document.querySelector('.account-panel').append(erase);
erase.onclick=async()=>{if(window.kinarc?.active())return notify('Finish or discard the workout first.');if(!await ask('Erase this local workspace?','This permanently clears this workspace’s local profiles, history, chat and preferences, including its legacy migration copy. Export a backup first. Other accounts and existing cloud data are kept.',{confirm:'Erase local data',danger:true}))return;const {createStore}=await import('./account-store.mjs');await database.replace({'kinarc.members.v1':'[{"id":"original","name":"My workshop"}]','kinarc.active':'original','kinarc.sync.enabled':'no'});const legacy=createStore(localStorage,c?.user?.uid||'');for(const key of legacy.keys())legacy.removeItem(key);location.reload()};
