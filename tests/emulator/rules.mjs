import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,deleteDoc} from 'firebase/firestore';
const env=await initializeTestEnvironment({projectId:'demo-kinarc',firestore:{rules:await readFile('firestore.rules','utf8'),host:'127.0.0.1',port:8080}});
const value={id:'session1',key:'kinarc.sessions.original',value:'{"reps":3}',order:0,revision:'rev1',baseRevision:null,deleted:false,updatedAt:Date.now()};
test('owner can write/read valid records; anonymous and other owners cannot',async()=>{
 const alice=env.authenticatedContext('alice').firestore(),bob=env.authenticatedContext('bob').firestore(),guest=env.unauthenticatedContext().firestore();
 await assertSucceeds(setDoc(doc(alice,'kinarcV2/alice/records/session1'),value));
 await assertSucceeds(getDoc(doc(alice,'kinarcV2/alice/records/session1')));
 await assertFails(getDoc(doc(bob,'kinarcV2/alice/records/session1')));await assertFails(setDoc(doc(bob,'kinarcV2/alice/records/session2'),value));await assertFails(getDoc(doc(guest,'kinarcV2/alice/records/session1')));
 await assertFails(getDocs(collection(bob,'kinarcV2/alice/records')));
});
test('malformed values, unrelated app paths and hard deletes are rejected',async()=>{
 const db=env.authenticatedContext('alice').firestore(),ref=doc(db,'kinarcV2/alice/records/session1');
 await assertFails(setDoc(ref,{...value,deleted:'yes'}));await assertFails(setDoc(ref,{...value,key:'private.admin'}));await assertFails(setDoc(ref,{...value,extra:'unexpected'}));await assertFails(setDoc(ref,{...value,value:'a'.repeat(100001)}));await assertFails(setDoc(doc(db,'users/alice'),value));await assertFails(deleteDoc(ref));await assertSucceeds(setDoc(ref,{...value,deleted:true,revision:'rev2'}));
});
test.after(async()=>env.cleanup());
