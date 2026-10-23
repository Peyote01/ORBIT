import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {startServer} from '../server/index.js';
test('two independent clients share a room and reconnect identity',async()=>{
 const app=startServer(0);await once(app.server,'listening');const port=app.server.address().port;const clients=[];
 async function join(msg){const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws');clients.push(ws);const messages=[];ws.on('message',raw=>messages.push(JSON.parse(raw)));await once(ws,'open');ws.send(JSON.stringify({type:'hello',...msg}));
  for(let i=0;i<100&&!messages.some(m=>m.type==='welcome');i++)await new Promise(r=>setTimeout(r,10));
  return {ws,messages,welcome:messages.find(m=>m.type==='welcome')};}
 try{
  const a=await join({create:true,name:'One'});assert.ok(a.welcome);
  const b=await join({code:a.welcome.code,name:'Two'});assert.ok(b.welcome);assert.notEqual(a.welcome.id,b.welcome.id);
  await new Promise(r=>setTimeout(r,150));
  assert.equal(a.messages.filter(m=>m.type==='state').at(-1).state.players.length,2);
  const response=await fetch('http://127.0.0.1:'+port+'/');assert.equal(response.status,200);assert.match(await response.text(),/ORBIT/);
  a.ws.close();await once(a.ws,'close');const c=await join({token:a.welcome.token});assert.equal(c.welcome.id,a.welcome.id);
 }finally{for(const ws of clients)ws.terminate();await app.close();}
});
