import test from 'node:test';import assert from 'node:assert/strict';import {exerciseList} from '../src/exercises.mjs';import {CycleTracker} from '../src/tracker.mjs';
for(const e of exerciseList)test(e.name+': valid cycle, mid-cycle start, missing frames and irregular intervals',()=>{
 const t=new CycleTracker(e.name);let now=0;const secondary=e.base==='Hip hinge'?155:e.base==='Bodyweight squat'?e.name==='Mini squat'?150:110:160;const start=e.raised?10:170,turn=e.raised?85:e.name==='Mini squat'?135:95;
 const hold=(a,b=secondary)=>{for(let i=0;i<28;i++)t.observe(a,now+=[27,43,31,45][i%4],b)};
 hold(turn);hold(start);assert.equal(t.reps,0);hold(turn);hold(start);assert.equal(t.reps,1);hold(turn);t.observe(null,now+=33);hold(start);assert.equal(t.reps,1);hold(turn);now+=800;hold(start);assert.equal(t.reps,1);
});
