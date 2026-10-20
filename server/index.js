import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {createGame,addPlayer,leavePlayer,act,setInput,tick,snapshot} from '../shared/game.js';
export function startServer(port=Number(process.env.PORT)||3000){
 const rooms=new Map(),sessions=new Map();
 const routes={'/':'public/index.html','/client.js':'public/client.js','/scene.js':'public/scene.js','/style.css':'public/style.css','/shared/game.js':'shared/game.js','/vendor/three.module.js':'node_modules/three/build/three.module.js','/vendor/three.core.js':'node_modules/three/build/three.core.js'};
 const server=http.createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,rooms:rooms.size}));}
  if(!routes[path]){res.writeHead(404);return res.end('Not found');}
  try{const data=await readFile(new URL('../'+routes[path],import.meta.url));res.writeHead(200,{'Content-Type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html','X-Content-Type-Options':'nosniff'});res.end(data);}
  catch{res.writeHead(500);res.end('Asset missing. Run npm install before starting.');}
 });
 const wss=new WebSocketServer({server,path:'/ws',maxPayload:8192});
 const send=(ws,msg)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<1024*1024)ws.send(JSON.stringify(msg));};
 wss.on('connection',(ws,req)=>{
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){ws.close(1008,'Origin mismatch');return;}
  let session=null,count=0,windowStart=Date.now();
  const deadline=setTimeout(()=>{if(!session)ws.close(1008,'Join timeout');},10000);
  ws.on('message',raw=>{
   try{
    if(Date.now()-windowStart>1000){count=0;windowStart=Date.now();}
    if(++count>70)throw Error('Too many messages.');
    const m=JSON.parse(raw.toString());
    if(!session){
     if(m.type!=='hello')throw Error('Join a room first.');
     if(m.token&&sessions.has(m.token)){
      session=sessions.get(m.token);
      if(!rooms.has(session.code)||!rooms.get(session.code).players[session.id]){sessions.delete(m.token);session=null;}
     }
     if(!session){
      let code=String(m.code||'').trim().toUpperCase();
      if(m.create){
       if(rooms.size>=32)throw Error('Server full. Try later.');
       do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));
       rooms.set(code,createGame(code));
      }
      const game=rooms.get(code);if(!game)throw Error('Room not found. Check its code.');
      const id=randomUUID();addPlayer(game,id,m.name);
      session={id,code,token:randomUUID(),ws:null,seen:new Map()};sessions.set(session.token,session);
     }
     if(session.ws&&session.ws!==ws)session.ws.close(1000,'Reconnected elsewhere');
     session.ws=ws;addPlayer(rooms.get(session.code),session.id,m.name);clearTimeout(deadline);
     send(ws,{type:'welcome',id:session.id,token:session.token,code:session.code});send(ws,{type:'state',state:snapshot(rooms.get(session.code))});return;
    }
    const game=rooms.get(session.code);if(!game)throw Error('Room expired.');
    if(m.type==='input')setInput(game,session.id,m);
    else if(m.type==='act'){
     if(typeof m.seq!=='string'||m.seq.length>64)throw Error('Action ID required.');
     if(session.seen.has(m.seq)){send(ws,session.seen.get(m.seq));return;}
     let reply;try{act(game,session.id,m.action);reply={type:'ack',seq:m.seq};}catch(e){reply={type:'error',seq:m.seq,message:e.message};}
     session.seen.set(m.seq,reply);if(session.seen.size>256)session.seen.delete(session.seen.keys().next().value);send(ws,reply);
    }
   }catch(e){send(ws,{type:'error',message:e.message});}
  });
  ws.on('close',()=>{clearTimeout(deadline);if(session?.ws===ws){session.ws=null;const g=rooms.get(session.code);if(g)leavePlayer(g,session.id);}});
  ws.on('error',()=>{});
 });
 let steps=0;
 const timer=setInterval(()=>{
  for(const [code,g] of rooms){
   tick(g,.05);
   if(!Object.values(g.players).some(p=>p.connected)){g.emptySince??=g.time;if(g.time-g.emptySince>300){rooms.delete(code);for(const [t,x]of sessions)if(x.code===code)sessions.delete(t);continue;}}
   else g.emptySince=null;
   if(steps%2===0){const message={type:'state',state:snapshot(g)};for(const x of sessions.values())if(x.code===code&&x.ws)send(x.ws,message);}
  }steps++;
 },50);
 server.listen(port,'0.0.0.0');
 return {server,rooms,close:()=>new Promise(resolve=>{clearInterval(timer);for(const ws of wss.clients)ws.terminate();wss.close();server.close(resolve);})};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {server}=startServer();server.on('listening',()=>console.log('ORBIT listening on port '+server.address().port));}
