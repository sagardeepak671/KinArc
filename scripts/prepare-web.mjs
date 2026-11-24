import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../dist/',import.meta.url);
const assets=[],revisions={};const hash=createHash('sha256');
async function walk(dir=''){
 for(const entry of await readdir(new URL(dir,root),{withFileTypes:true})){
  const path=dir+entry.name;if(entry.isDirectory())await walk(path+'/');else if(!['sw.js','.DS_Store'].includes(entry.name)){assets.push('./'+path);hash.update(path);const bytes=await readFile(new URL(path,root));hash.update(bytes);revisions['./'+path]=createHash('sha256').update(bytes).digest('hex').slice(0,12)}
 }
}
await walk();const version=hash.digest('hex').slice(0,12);
const shell=assets.filter(a=>!a.includes('/pose')&&!a.includes('/voice/'));
await writeFile(new URL('offline-assets.json',root),JSON.stringify({version,assets}));
await writeFile(new URL('sw.js',root),`const PREFIX='kinarc-'+encodeURIComponent(new URL('./',self.location.href).pathname)+'-',CACHE=PREFIX+'${version}',HEAVY=PREFIX+'assets';
const SHELL=${JSON.stringify(shell)},ALL=${JSON.stringify(assets)},REVISIONS=${JSON.stringify(revisions)};
const keyFor=path=>{const url=new URL(path,self.location.href);if(!SHELL.includes(path))url.searchParams.set('rev',REVISIONS[path]);return url};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('message',e=>{
 if(e.data==='activate')self.skipWaiting();
 if(e.data?.type==='download')e.waitUntil((async()=>{const cache=await caches.open(HEAVY);let done=0;for(const path of ALL){if(!await caches.match(keyFor(path))){const response=await fetch(path);if(!response.ok)throw Error('Failed download');await cache.put(keyFor(path),response)}e.source?.postMessage({type:'download-progress',done:++done,total:ALL.length})}e.source?.postMessage({type:'download-complete'})})().catch(()=>e.source?.postMessage({type:'download-error'})));
 if(e.data?.type==='status')e.waitUntil((async()=>{let done=0;for(const path of ALL)if(await caches.match(keyFor(path)))done++;e.source?.postMessage({type:'download-progress',done,total:ALL.length})})());
});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE&&k!==HEAVY).map(k=>caches.delete(k)))).then(async()=>{const cache=await caches.open(HEAVY),keep=new Set(ALL.map(p=>keyFor(p).href));for(const key of await cache.keys())if(!keep.has(key.url))await cache.delete(key);await self.clients.claim()})));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('/api/'))return;
 if(e.request.mode==='navigate'){e.respondWith(caches.match(new URL('./index.html',self.location.href)).then(r=>r||fetch(e.request)));return}
 const path=ALL.find(a=>new URL(a,self.location.href).pathname===u.pathname);const cacheKey=path?keyFor(path):e.request;
 e.respondWith(caches.match(cacheKey).then(async r=>{if(r)return r;const response=await fetch(e.request);if(response.ok&&path&&!e.request.headers.has('range')){const cache=await caches.open(HEAVY);await cache.put(cacheKey,response.clone())}return response}));
});
`);
console.log(`Prepared KinArc ${version}: ${shell.length} shell assets, ${assets.length} optional offline assets.`);
