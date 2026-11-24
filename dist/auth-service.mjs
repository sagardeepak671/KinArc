import {firebaseConfig} from './firebase-config.mjs';
export const emulator=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('emulators');
let client;
export async function initIdentity(){
 if(!firebaseConfig?.apiKey&&!emulator)return {user:null,configured:false};
 const f=await import('./vendor/firebase-client.mjs');const config=emulator?{apiKey:'demo-key',authDomain:'demo-kinarc.firebaseapp.com',projectId:'demo-kinarc',appId:'demo-app'}:firebaseConfig;
 const app=f.initializeApp(config),auth=f.getAuth(app),db=f.getFirestore(app);if(emulator){f.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});f.connectFirestoreEmulator(db,'127.0.0.1',8080)}
 await f.setPersistence(auth,f.browserSessionPersistence);
 await f.getRedirectResult(auth).catch(error=>{if(error?.code)console.warn('Google redirect sign-in did not complete:',error.code)});
 const user=await new Promise((resolve,reject)=>{let unsub;const timeout=setTimeout(()=>{unsub?.();reject(Error('Sign-in check timed out. Continue as guest or retry when connected.'))},12000);unsub=f.onAuthStateChanged(auth,u=>{clearTimeout(timeout);unsub?.();resolve(u)},reject)});
 client={f,app,auth,db,user,configured:true};return client;
}
export const identity=()=>client;
export async function login(options={}){
 const c=client;if(!c)throw Error('Account setup is unavailable.');
 const p=new c.f.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
 if(options.redirect){
  await c.f.signInWithRedirect(c.auth,p);
  return;
 }
 try{
  await c.f.signInWithPopup(c.auth,p);
 }catch(error){
  if(['auth/popup-blocked','auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(error.code)){
   await c.f.signInWithRedirect(c.auth,p);
   return;
  }
  throw error;
 }
}
export async function logout(){await client?.f.signOut(client.auth)}
