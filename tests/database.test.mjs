import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {Database,project,unpack} from '../src/database.mjs';
const scope=()=>crypto.randomUUID();
test('legacy migration is durable, preserves originals and normalizes stable record IDs',async()=>{
 const legacy={'kinarc.members.v1':'[{"id":"original","name":"Guest"}]','kinarc.sessions.v1':'[{"date":"2026-11-23T00:00:00Z","reps":3}]'};
 const id=scope(),d=await new Database(indexedDB).open(id,legacy);assert.equal(JSON.parse(d.getItem('kinarc.sessions.v1'))[0].reps,3);const stable=JSON.parse(d.getItem('kinarc.sessions.v1'))[0].id;assert.ok(stable);d.close();const next=await new Database(indexedDB).open(id,{'kinarc.sessions.v1':'[]'});assert.equal(JSON.parse(next.getItem('kinarc.sessions.v1'))[0].id,stable);assert.equal(legacy['kinarc.sessions.v1'],'[{"date":"2026-11-23T00:00:00Z","reps":3}]');next.close();
});
test('queued writes retain latest settings, individual sessions and deletion tombstones',async()=>{
 const d=await new Database(indexedDB).open(scope());d.setItem('kinarc.settings','one');d.setItem('kinarc.settings','two');d.setItem('kinarc.sessions.v1',JSON.stringify([{id:'a',reps:2},{id:'b',reps:4}]));await d.flush();assert.equal(d.getItem('kinarc.settings'),'two');assert.equal(d.records.size,3);d.setItem('kinarc.sessions.v1',JSON.stringify([{id:'b',reps:4}]));await d.flush();assert.equal(d.records.get('kinarc.sessions.v1~a').deleted,true);assert.equal(JSON.parse(d.getItem('kinarc.sessions.v1')).length,1);d.close();
});
test('account scopes cannot read each other and snapshot replacement is atomic',async()=>{
 const a=await new Database(indexedDB).open(scope()),b=await new Database(indexedDB).open(scope());a.setItem('kinarc.test','secret');await a.flush();assert.equal(b.getItem('kinarc.test'),null);await a.replace({'kinarc.test':'new'});assert.equal(a.getItem('kinarc.test'),'new');a.close();b.close();
});
test('migration failure leaves source data unchanged and is retryable',async()=>{
 const legacy={'kinarc.members.v1':'[null]'},id=scope();await assert.rejects(new Database(indexedDB).open(id,legacy));assert.equal(legacy['kinarc.members.v1'],'[null]');const d=await new Database(indexedDB).open(id,{'kinarc.members.v1':'[{"id":"original","name":"Recovered"}]'});assert.equal(JSON.parse(d.getItem('kinarc.members.v1'))[0].name,'Recovered');d.close();
});
test('aborted restore transaction retains prior durable and visible workspace',async()=>{
 const id=scope(),d=await new Database(indexedDB).open(id);d.setItem('kinarc.test','preserved');await d.flush();const original=d.db.transaction.bind(d.db);d.db.transaction=(...args)=>{const tx=original(...args);queueMicrotask(()=>tx.abort());return tx};await assert.rejects(d.replace({'kinarc.test':'replacement'}));d.db.transaction=original;assert.equal(d.getItem('kinarc.test'),'preserved');d.close();const reopened=await new Database(indexedDB).open(id);assert.equal(reopened.getItem('kinarc.test'),'preserved');reopened.close();
});
