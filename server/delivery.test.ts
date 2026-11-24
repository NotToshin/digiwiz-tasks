import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTransition } from './delivery.ts';

test('required review cannot be skipped',()=>{
 assert.throws(()=>validateTransition('In Progress','Done',true,true,''));
 assert.doesNotThrow(()=>validateTransition('In Progress','In Review',true,false,''));
});
test('only reviewer can approve or return and return needs feedback',()=>{
 assert.throws(()=>validateTransition('In Review','Done',true,false,''));
 assert.throws(()=>validateTransition('In Review','In Progress',true,true,''));
 assert.doesNotThrow(()=>validateTransition('In Review','In Progress',true,true,'Revise layout'));
 assert.doesNotThrow(()=>validateTransition('In Review','Done',true,true,''));
});
test('completed tasks are immutable and new tasks must be open',()=>{
 assert.throws(()=>validateTransition('Done','Done',false,true,''));
 assert.throws(()=>validateTransition(undefined,'Done',false,true,''));
 assert.doesNotThrow(()=>validateTransition('In Progress','Waiting for Client',false,false,''));
});
