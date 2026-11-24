import test from 'node:test';
import assert from 'node:assert/strict';
import {Coach,correction,phrases} from '../src/coach.mjs';
import {existsSync} from 'node:fs';
test('coaching debounces corrections and prioritizes target completion',()=>{
 const events=[],c=new Coach('Elbow curl',5,key=>events.push(key));
 const signal={visible:true,issue:'elbow',reps:0,phase:'extended'};
 c.update(signal,0);c.update(signal,1000);assert.deepEqual(events,[]);
 c.update(signal,1500);c.update(signal,2000);assert.deepEqual(events,['elbow']);
 c.update({...signal,issue:null,reps:3},7000);assert.equal(events.at(-1),'two');
 c.update({...signal,issue:null,reps:5},7200);assert.equal(events.at(-1),'complete');
 c.update(signal,30000);assert.equal(events.length,3);
});
test('lost tracking never produces a form accusation',()=>{
 const events=[],c=new Coach('Hip hinge',5,key=>events.push(key));
 c.update({visible:false,issue:'hinge'},0);c.update({visible:false,issue:'hinge'},1500);
 assert.deepEqual(events,['lost']);
 assert.equal(correction('Hip hinge',[],'left',640,480,null),null);
});
test('all coach phrases have audio assets',()=>{
 for(const key of Object.keys(phrases))assert.ok(existsSync(new URL('../public/voice/coach-'+key+'.mp3',import.meta.url)),key)
});
test('exercise corrections use their required visible geometry',()=>{
 const points=[];for(const [i,x,y] of [[11,.3,.2],[13,.7,.3],[15,.5,.2],[23,.3,.6],[25,.4,.9]])points[i]={x,y,visibility:.95};
 for(const [exercise,expected,obs] of [
 ['Elbow curl','elbow',{angle:90}],
 ['Arm raise','arm',{angle:80}],
 ['Knee bend','knee',{angle:110}],
 ['Bodyweight squat','squat',{angle:110,secondary:160}],
 ['Hip hinge','hinge',{angle:110,secondary:110}]]){
  assert.equal(correction(exercise,points,'left',640,480,obs),expected);
 }
 assert.equal(correction('Elbow curl',points,'right',640,480,{angle:90}),null);
});
