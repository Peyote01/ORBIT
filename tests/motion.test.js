import test from 'node:test';
import assert from 'node:assert/strict';
import {MotionTrack} from '../public/motion.js';
test('20Hz positions produce constant-speed movement at 60Hz',()=>{
 const track=new MotionTrack(65),out=[],positions=[];
 for(let frame=0;frame<=60;frame++){
  const now=frame*1000/60;
  if(frame%3===0)track.push(now,[now*.006,0,0],'run1');
  track.sample(now,out);if(now>=100)positions.push(out[0]);
 }
 for(let i=1;i<positions.length;i++)assert.ok(Math.abs(positions[i]-positions[i-1]-.1)<1e-8);
});
test('stopping and missing packets hold position instead of drifting',()=>{
 const track=new MotionTrack(),out=[];
 track.push(0,[0,0,0]);track.push(50,[.3,0,0]);track.push(100,[.3,0,0]);
 track.sample(1000,out);assert.equal(out[0],.3);
});
test('teleports, new runs and resume after pauses reset interpolation',()=>{
 const track=new MotionTrack(),out=[];
 track.push(0,[0,0,0],'a');track.push(50,[30,0,0],'a');track.sample(50,out);assert.equal(out[0],30);
 track.push(100,[2,0,0],'b');track.sample(100,out);assert.equal(out[0],2);
 track.push(800,[3,0,0],'b');track.sample(800,out);assert.equal(out[0],3);
});
