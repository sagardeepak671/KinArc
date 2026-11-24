import test from 'node:test';
import assert from 'node:assert/strict';
import {WebCoach} from '../src/web-coach.mjs';
test('deployed device coach repeats sustained corrections after target and stops when closed',()=>{
 const old=globalThis.document;globalThis.document={getElementById:()=>({value:'device'})};
 try{
  const said=[];const c=new WebCoach('Standing hamstring curl',3,{stop(){},isSpeaking:()=>false,device:t=>said.push(t)});
  const start=performance.now();const o={visible:true,issue:'hamstring',reps:4,phase:'bent'};
  c.update(o,start);c.update(o,start+1600);assert.match(said[0],/thigh/);
  c.update(o,start+8200);assert.equal(said.length,2);
  c.stop();c.update(o,start+16000);assert.equal(said.length,2);
 }finally{globalThis.document=old}
});
test('a rep milestone waits for speech instead of being silently dropped',()=>{const old=globalThis.document;globalThis.document={getElementById:()=>({value:'device'})};try{let speaking=true;const said=[],c=new WebCoach('Knee bend',3,{stop(){},isSpeaking:()=>speaking,device:t=>said.push(t)});const now=performance.now();c.update({visible:true,issue:null,reps:1,phase:'extended'},now);assert.equal(said.length,0);speaking=false;c.update({visible:true,issue:null,reps:1,phase:'extended'},now+2100);assert.match(said[0],/two repetitions left/i);c.stop()}finally{globalThis.document=old}});
