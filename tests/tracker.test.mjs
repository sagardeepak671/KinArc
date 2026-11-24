import test from 'node:test';
import assert from 'node:assert/strict';
import {knee,CycleTracker} from '../src/tracker.mjs';
test('geometry uses pixels, side and landmark confidence',()=>{
 const p=[];for(const [i,x,y] of [[23,.2,.2],[25,.2,.6],[27,.4,.6]])p[i]={x,y,visibility:.97};
 assert.equal(knee(p,'left',640,480).angle,90);assert.equal(knee(p,'right',640,480),null);
 p[27].visibility=.2;assert.equal(knee(p,'left',640,480),null)
});
test('repetitions require sustained endpoints and uninterrupted observation',()=>{
 const t=new CycleTracker();let now=0;
 const hold=a=>{for(let i=0;i<24;i++)t.observe(a,now+=33)};
 hold(102);hold(167);assert.equal(t.reps,0);
 t.observe(95,now+=33);hold(167);assert.equal(t.reps,0);
 hold(102);hold(167);hold(167);assert.equal(t.reps,1);
 hold(102);t.observe(null,now+=33);hold(167);assert.equal(t.reps,1);
 hold(102);now+=800;hold(167);assert.equal(t.reps,1)
});
test('the full pose model ships with a TensorFlow Lite header',async()=>{
 const {readFile}=await import('node:fs/promises');
 const bytes=await readFile(new URL('../public/pose_landmark_full.tflite',import.meta.url));
 assert.equal(bytes.toString('ascii',4,8),'TFL3');assert.ok(bytes.length>1000000)
});

test('coordinated movements require the supporting joint to match the movement',()=>{
  for(const [name,wrong,correct] of [['Hip hinge',100,155],['Bodyweight squat',165,110]]){
    const tracker=new CycleTracker(name);let time=0;
    const hold=(a,b)=>{for(let i=0;i<30;i++)tracker.observe(a,time+=33,b)};
    hold(168,160);hold(100,wrong);hold(168,160);assert.equal(tracker.reps,0);
    hold(100,correct);hold(168,160);assert.equal(tracker.reps,1)
  }
});

test('every added movement completes a sustained cycle with its own range',()=>{
 for(const [exercise,start,turn,secondary] of [['Hammer curl',168,95,160],['Front raise',10,85,160],['Mini squat',168,138,150],['Standing hamstring curl',168,95,160],['Good morning',168,100,155]]){
  const t=new CycleTracker(exercise);let now=0;
  const hold=a=>{for(let i=0;i<30;i++)t.observe(a,now+=33,secondary)};
  hold(start);hold(turn);hold(start);assert.equal(t.reps,1,exercise);
  hold(turn);t.observe(null,now+=33);hold(start);assert.equal(t.reps,1,exercise+' rejects interrupted cycles');
 }
});

test('all tracked exercises accept both sides, reject low confidence and invalid dimensions',async()=>{
 const {exerciseList}=await import('../src/exercises.mjs');
 for(const e of exerciseList){
  let points;
  for(const side of ['left','right']){points=Array.from({length:33},()=>({x:.5,y:.5,visibility:.99}));const offset=side==='right'?1:0;const positions=e.joints.length===4?[[.2,.1],[.2,.35],[.4,.6],[.4,.9]]:[[.2,.2],[.2,.5],[.5,.5]];e.joints.forEach((i,j)=>points[i+offset]={x:positions[j][0],y:positions[j][1],visibility:.99});const result=knee(points,side,640,480,e.name);assert.ok(result,e.name+' '+side);points[e.joints[0]+offset].visibility=.2;assert.equal(knee(points,side,640,480,e.name),null)}
  assert.equal(knee(points,'left',0,480,e.name),null);
 }
});
test('custom ranges enforce direction, bounded angles, duplicate timestamps and partial cycle resets',()=>{
 assert.throws(()=>new CycleTracker('Knee bend',{start:200,end:90}));assert.throws(()=>new CycleTracker('Arm raise',{start:90,end:30}));
 const t=new CycleTracker('Knee bend',{start:160,end:100});let now=0;const hold=a=>{for(let i=0;i<30;i++)t.observe(a,now+=37)};hold(170);hold(90);t.observe(90,now);hold(170);assert.equal(t.reps,0);hold(90);hold(170);assert.equal(t.reps,1);
});
