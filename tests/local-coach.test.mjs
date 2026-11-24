import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalCoach} from '../src/local-coach.mjs';
test('local generation discards a correction after the observation changes',async()=>{
 let finish,spoken=0;
 const original=globalThis.fetch;
 globalThis.fetch=()=>new Promise(resolve=>{finish=resolve});
 try{
  const c=new LocalCoach('Elbow curl',5,{generated(){spoken++},stop(){}});
  c.started=performance.now()-3000;
  const start=performance.now();
  await c.update({visible:true,issue:'elbow',reps:5,phase:'bent'},start);
  const request=c.update({visible:true,issue:'elbow',reps:5,phase:'bent'},start+1600);
  await c.update({visible:true,issue:null,reps:5,phase:'extended'},start+1700);
  finish({ok:true,json:async()=>({text:'correction',audio:'data'})});
  await request;assert.equal(spoken,0);
  c.stop();assert.equal(c.closed,true);
 }finally{globalThis.fetch=original}
});
test('generation continues after the rep target and stops when the session closes',async()=>{
 let finish,spoken=0;
 const original=globalThis.fetch;
 globalThis.fetch=()=>new Promise(resolve=>{finish=resolve});
 try{
  const c=new LocalCoach('Knee bend',3,{generated(){spoken++},stop(){}});
  c.started=performance.now()-3000;
  const request=c.update({visible:true,issue:null,reps:4,phase:'extended'},performance.now());
  assert.equal(typeof finish,'function');
  c.stop();
  finish({ok:true,json:async()=>({text:'new feedback',audio:'data'})});
  await request;
  assert.equal(spoken,0);
 }finally{globalThis.fetch=original}
});
