import test from 'node:test';
import assert from 'node:assert/strict';
import {completedToday} from '../src/plan.mjs';
test('routine credit belongs to a specific entry and local practice day',()=>{
  const item={id:'a',exercise:'Arm raise',side:'right',goal:5};
  const now=new Date(2026,10,4,12);
  const session={...item,date:now.toISOString(),mode:'Camera',reps:5,planId:item.id};
  assert.ok(completedToday(item,[session],now));
  for(const override of [{date:new Date(2026,10,3,23).toISOString()},{reps:4},{planId:'b'},{side:'left'},{mode:'Clay rehearsal'}]){
    assert.equal(completedToday(item,[{...session,...override}],now),false);
  }
});
