import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,validateSnapshot} from '../src/account-store.mjs';
function memory(){const values={};return new Proxy({getItem:k=>values[k]??null,setItem:(k,v)=>{values[k]=String(v)},removeItem:k=>delete values[k]},{ownKeys:()=>Object.keys(values),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})})}
test('guest and two account workspaces never share keys',()=>{
 const s=memory(),guest=createStore(s),a=createStore(s,'alice'),b=createStore(s,'bob');
 guest.setItem('kinarc.members.v1','guest');a.setItem('kinarc.members.v1','alice');b.setItem('kinarc.members.v1','bob');
 s.setItem('kinarc.accountScope','alice');assert.deepEqual(guest.keys(),['kinarc.members.v1']);
 assert.equal(a.getItem('kinarc.members.v1'),'alice');assert.equal(b.getItem('kinarc.members.v1'),'bob');
 a.removeItem('kinarc.members.v1');assert.equal(guest.getItem('kinarc.members.v1'),'guest');assert.equal(b.getItem('kinarc.members.v1'),'bob');
});
test('restores reject scope manipulation, malformed profiles and sessions',()=>{
 const good={'kinarc.members.v1':JSON.stringify([{id:'original',name:'Guest'}])};
 assert.equal(validateSnapshot(good),good);
 assert.throws(()=>validateSnapshot({...good,'kinarc.accountScope':'bob'}));
 assert.throws(()=>validateSnapshot({'kinarc.members.v1':'[]'}));
 assert.throws(()=>validateSnapshot({...good,'kinarc.sessions.v1':'[{"date":"bad","reps":-2}]'}));
});

test('backup validation rejects duplicate identity records and unsafe routine configurations',()=>{
 const base={'kinarc.members.v1':'[{"id":"original","name":"Guest"}]'};
 assert.throws(()=>validateSnapshot({'kinarc.members.v1':'[{"id":"same","name":"A"},{"id":"same","name":"B"}]'}));
 assert.throws(()=>validateSnapshot({...base,'kinarc.routines.original':JSON.stringify([{id:'routine',name:'Unsafe',weekdays:[8],items:[]}])}));
 assert.throws(()=>validateSnapshot({...base,'kinarc.routines.original':JSON.stringify([{id:'routine',name:'Bad',weekdays:[1],items:[{id:'item',exercise:'Made up',side:'left',goal:5,sets:0}]}])}));
});
test('legacy workspace validation rejects corruption before touching source storage',async()=>{const {initializeStore}=await import('../src/account-store.mjs');const {indexedDB}=await import('fake-indexeddb');class Memory{getItem(k){return this[k]??null}setItem(k,v){this[k]=v}removeItem(k){delete this[k]}}const storage=new Memory();storage.setItem('kinarc.members.v1','[null]');await assert.rejects(initializeStore('',storage,indexedDB));assert.equal(storage.getItem('kinarc.members.v1'),'[null]');});
