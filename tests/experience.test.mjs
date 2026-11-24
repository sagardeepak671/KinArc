import test from 'node:test';
import assert from 'node:assert/strict';
import {activitySummary,catalog} from '../src/experience.mjs';
test('dashboard excludes rehearsals and counts unique local practice days',()=>{
 const now=new Date(2026,10,23,12);
 const rows=[{date:new Date(2026,10,23,10).toISOString(),mode:'Camera',reps:5},{date:new Date(2026,10,23,11).toISOString(),mode:'Video file',reps:3},{date:new Date(2026,10,22,11).toISOString(),mode:'Camera',reps:4},{date:now.toISOString(),mode:'Clay rehearsal',reps:100}];
 const s=activitySummary(rows,now);assert.equal(s.weekDays,1);assert.equal(s.weekReps,8);assert.equal(s.streak,2);assert.equal(Object.keys(catalog).length,10);
});
