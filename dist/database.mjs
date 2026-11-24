// Each session, profile and routine is a separate record. Legacy keys form a compatibility view.
const uuid=()=>crypto.randomUUID();
export function unpack(key,value){
 let parsed;try{parsed=JSON.parse(value)}catch{}
 if(Array.isArray(parsed)&&(/^(kinarc\.members\.v1|kinarc\.sessions\.|kinarc\.routines?\.|kinarc\.routineHistory\.)/.test(key))){
  return parsed.map((item,index)=>{if(!item||typeof item!=='object')throw Error('Invalid saved record.');const id=item.id||'legacy-'+index+'-'+encodeURIComponent(item.date||item.name||'record');return {id:key+'~'+id,key,value:JSON.stringify({...item,id}),order:index}});
 }
 return [{id:key,key,value,order:0}];
}
export function project(records){
 const grouped=new Map();for(const row of records){if(row.deleted)continue;if(!grouped.has(row.key))grouped.set(row.key,[]);grouped.get(row.key).push(row)}
 const result={};for(const [key,rows] of grouped){rows.sort((a,b)=>a.order-b.order);result[key]=rows[0].id.includes('~')?JSON.stringify(rows.map(r=>JSON.parse(r.value))):rows[0].value}
 return result;
}
const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
export class Database {
 constructor(factory=globalThis.indexedDB){this.factory=factory;this.cache={};this.records=new Map();this.queue=Promise.resolve();this.scope='guest';this.optimistic=new Map();this.listeners=new Set()}
 async open(scope='guest',legacy,validate){
  this.scope=scope;if(typeof window!=='undefined'){this.channel=new BroadcastChannel('kinarc-data');this.channel.onmessage=async e=>{if(e.data?.scope!==this.scope)return;await this.flush();const tx=this.db.transaction('records','readonly');const fresh=await request(tx.objectStore('records').index('scope').getAll(this.scope));this.records=new Map(fresh.map(r=>[r.id,r]));this.rebuild();window.dispatchEvent(new CustomEvent('kinarc-data-updated'))}}this.db=await new Promise((resolve,reject)=>{const r=this.factory.open('kinarc-v2',1);r.onupgradeneeded=()=>{const db=r.result;const s=db.createObjectStore('records',{keyPath:'pk'});s.createIndex('scope','scope');db.createObjectStore('meta')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const tx=this.db.transaction(['records','meta'],'readonly');const rows=await request(tx.objectStore('records').index('scope').getAll(scope));const migrated=await request(tx.objectStore('meta').get('migrated:'+scope));
  this.records=new Map(rows.map(r=>[r.id,r]));this.cache=project(rows);
  if(!migrated){
   const entries=legacy||{};if(validate&&Object.keys(entries).length){entries['kinarc.members.v1']??='[{"id":"original","name":"My workshop"}]';validate(entries)}const incoming=[];for(const [key,value] of Object.entries(entries)){if(!key.startsWith('kinarc.')||key==='kinarc.accountScope')continue;try{incoming.push(...unpack(key,value))}catch{throw Error('Legacy data could not be migrated. Original localStorage was preserved. Export it before retrying.')}}
   // Migration is one IndexedDB transaction; the original localStorage is never deleted.
   await this.transaction(incoming.map(r=>({...r,revision:uuid(),baseRevision:null,pending:true,updatedAt:Date.now(),deleted:false})),true);
  }
  return this;
 }
 async transaction(rows,migration=false){
  return new Promise((resolve,reject)=>{const tx=this.db.transaction(['records','meta'],'readwrite');for(const row of rows)tx.objectStore('records').put({...row,scope:this.scope,pk:this.scope+'|'+row.id});if(migration)tx.objectStore('meta').put(true,'migrated:'+this.scope);tx.oncomplete=()=>{for(const row of rows)this.records.set(row.id,row);this.rebuild();resolve()};tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'))});
 }
 getItem(key){return this.cache[key]??null}
 keys(){return Object.keys(this.cache)}
 setItem(key,value){this.change(key,String(value))}
 removeItem(key){this.change(key,null)}
 change(key,value){
  if(!key.startsWith('kinarc.')||key==='kinarc.accountScope')throw Error('Invalid workspace key');
  const token=uuid();this.optimistic.set(key,{value,token});const before={...this.cache};if(value===null)delete this.cache[key];else this.cache[key]=value;
  this.queue=this.queue.catch(()=>{}).then(async()=>{
   const target=value===null?[]:unpack(key,value),ids=new Set(target.map(r=>r.id)),changes=[];
   for(const row of this.records.values())if(row.key===key&&!ids.has(row.id)&&!row.deleted)changes.push({...row,value:'',deleted:true,revision:uuid(),pending:true,updatedAt:Date.now()});
   for(const row of target){const old=this.records.get(row.id);if(old?.value===row.value&&!old.deleted&&old.order===row.order)continue;changes.push({...row,revision:uuid(),baseRevision:old?.baseRevision||null,pending:true,deleted:false,updatedAt:Date.now()})}
   try{await this.transaction(changes);if(this.optimistic.get(key)?.token===token)this.optimistic.delete(key);this.rebuild();this.channel?.postMessage({scope:this.scope});for(const fn of this.listeners)fn()}catch(error){if(this.optimistic.get(key)?.token===token)this.optimistic.delete(key);this.rebuild();globalThis.dispatchEvent?.(new CustomEvent('kinarc-storage-error',{detail:error.message}));throw error}
  });
 }
 async flush(){await this.queue}
 async replace(data){
  await this.flush();const rows=Object.entries(data).flatMap(([k,v])=>unpack(k,v));const ids=new Set(rows.map(r=>r.id));const changes=[...this.records.values()].filter(r=>!ids.has(r.id)).map(r=>({...r,value:'',deleted:true,pending:true,revision:uuid(),updatedAt:Date.now()}));
  for(const row of rows)changes.push({...row,deleted:false,pending:true,baseRevision:this.records.get(row.id)?.baseRevision||null,revision:uuid(),updatedAt:Date.now()});await this.transaction(changes);for(const fn of this.listeners)fn();
 }
 rebuild(){this.cache=project([...this.records.values()]);for(const [key,{value}] of this.optimistic){if(value===null)delete this.cache[key];else this.cache[key]=value}}
 close(){this.channel?.close();this.db?.close()}
}
