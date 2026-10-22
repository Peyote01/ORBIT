import {createScene} from './scene.js';
import {STATIONS,MODELS,MODEL_KEYS,GOODS,UPGRADES,distance,holdDimensions,volume,facingClue,tractorSlot} from '/shared/game.js';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let view;try{view=createScene($('world'));}catch(e){$('status').textContent='WebGL unavailable: '+e.message;throw e;}
let tractorEquipped=true,beamDistance=4,beamAngle=0,activeTractor=null;
let ws,state,id,token=sessionStorage.getItem('orbit-token'),panel=null,yaw=0,pitch=0,sequence=0,keys={},drag=false,toastTimer,rotateDelta=0,rotationId=0,rotationQueue=[],rotationWreck=null;
const me=()=>state?.players.find(p=>p.id===id);
function toast(t){$('toast').textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',5000);}
function action(type,extra={}){
 if(ws?.readyState!==1)return null;
 const seq=Date.now()+'-'+sequence++;ws.send(JSON.stringify({type:'act',seq,action:{type,...extra}}));return seq;
}
function flushRotation(){
 if(!rotateDelta||panel!=='scanner')return;
 const delta=Math.max(-.15,Math.min(.15,rotateDelta));rotateDelta=0;
 const n=++rotationId,seq=action('rotate',{delta,rotationId:n});
 if(seq)rotationQueue.push({id:n,seq,delta});
}
function scan(){flushRotation();action('scan');}
function resetRotation(){rotateDelta=0;rotationQueue=[];drag=false;}

function connect(create=false,resume=false){
 if(ws)ws.close();$('status').textContent='Connecting…';
 const socket=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');ws=socket;
 socket.onopen=()=>socket.send(JSON.stringify({type:'hello',create,code:$('code').value,name:$('name').value,token:resume?token:null}));
 socket.onmessage=e=>{
  const m=JSON.parse(e.data);
  if(m.type==='welcome'){id=m.id;token=m.token;sessionStorage.setItem('orbit-token',token);$('lobby').hidden=true;for(const el of ['hud','crew','crosshair','logs','controls'])$(el).hidden=false;toast('Room '+m.code+' — share this code. Click the scene to look around.');}
  if(m.type==='error'){rotationQueue=rotationQueue.filter(r=>r.seq!==m.seq);$('status').textContent=m.message;toast(m.message);}
  if(m.type==='state'){const received=performance.now();if(lastSnapshot)snapshotGap=Math.max(snapshotGap,received-lastSnapshot);lastSnapshot=received;snapshotCount++;state=m.state;
   const own=me()?.tractor;
   if(own?.id!==activeTractor){
    activeTractor=own?.id||null;
    if(own){beamDistance=own.distance;beamAngle=own.angle;}
   }
   if(rotationWreck!==state.wreck?.id){resetRotation();rotationWreck=state.wreck?.id;}
   const acknowledged=state.wreck?.rotationAcks?.[id]??-1;
   rotationQueue=rotationQueue.filter(r=>r.id>acknowledged);
   view.update(state,id);render();}
 };
 socket.onclose=()=>{if(ws===socket)toast('Disconnected. Reload to reconnect; crew seat reserved for 60 seconds.');};
 socket.onerror=()=>{$('status').textContent='Connection failed. Is the game server running?';};
}
$('create').onclick=()=>connect(true);$('join').onclick=()=>connect(false);if(token)connect(false,true);
function openPanel(key){if(panel==='scanner'&&key!=='scanner'){flushRotation();drag=false;document.exitPointerLock();}panel=key;$('panel').hidden=!key;view.setMode(key);if(key)document.exitPointerLock();htmlCache.delete('panel');renderPanel();}
const btn=(label,type,data={})=>'<button data-action="'+type+'" data-json="'+esc(JSON.stringify(data))+'">'+esc(label)+'</button>';
const htmlCache=new Map();
function setHTML(id,html){if(htmlCache.get(id)!==html){$(id).innerHTML=html;htmlCache.set(id,html);}}
function render(){
 const p=me();if(!p)return;
 setHTML('hud','<strong>ORBIT / '+esc(state.code)+'</strong><span>CREW <b>'+state.players.filter(p=>p.connected).length+'/4</b></span><span>₡ <b>'+state.credits+'</b></span><span>FUEL '+state.ship.fuel+'/'+state.ship.maxFuel+'</span><span>HULL '+state.ship.hull+'/'+state.ship.maxHull+'</span><span>DAY <b>'+state.quota.days+'/'+state.quota.limit+'</b> · QUOTA ₡'+state.quota.amount+(state.quota.due?' · PAYMENT DUE':'')+'</span>');
 setHTML('crew',state.players.map(p=>esc(p.name)+(p.id===state.captain?' ★':'')+' · '+(p.connected?p.hp+' HP':'offline')).join('<br>')+'<br><br>'+state.phase.toUpperCase()+' / '+esc(state.location)+(state.encounter?'<br>'+state.encounter.type.toUpperCase()+' · '+state.encounter.stage+'<br>'+Math.max(0,Math.ceil((state.encounter.until||state.time)-state.time))+' sec · HP '+state.encounter.hp:''));
 setHTML('logs',state.log.slice(0,5).map(l=>'<div>'+esc(l.text)+'</div>').join(''));
 $('shutter').hidden=!state.wreck?.crunchAt;
 const near=nearest(),attached=p.tractor&&state.cargo.find(c=>c.id===p.tractor.id);
 $('tractor-status').textContent=tractorEquipped?(attached?'TRACTOR LOCKED · '+attached.type.toUpperCase()+' · '+beamDistance.toFixed(1)+'m':'TRACTOR READY [T]'):'TRACTOR STOWED [T]';
 $('tractor-status').classList.toggle('active',!!attached);
 const slot=attached?tractorSlot(state,attached):null;
 $('placement').textContent=attached?(slot?(slot.valid?'GREEN GRID · E TO SECURE':'RED GRID · ADJUST CARGO'):'MOVE CRATE INTO CARGO BAY'):'';
 $('placement').className=slot?.valid?'valid':slot?'invalid':'';
 $('prompt').textContent=panel?'':p.held?'Carrying '+GOODS[state.cargo.find(c=>c.id===p.held)?.type]?.name+' · E at cargo console to stow · Q drop':near?'E · '+near.label:'Starboard rear airlock → EVA to wreck';
 if(panel)renderPanel();
 $('room-code').textContent=state.code;$('quick-actions').hidden=false;
 $('stamina').textContent='STAMINA '+Math.round(p.stamina??100)+'%'+(p.sprintExhausted?' · recovering':'');
}
function nearest(){
 const p=me();if(!p)return null;
 const options=Object.entries(STATIONS).map(([key,pos])=>({key,pos,label:key.toUpperCase()}));
 if(!p.held)for(const c of state.cargo)if(c.state==='loose')options.push({cargo:c.id,pos:c.pos,label:'Recover '+GOODS[c.type].name+' '+c.dims.join('×')+'m'});
 options.sort((a,b)=>distance(p.pos,a.pos)-distance(p.pos,b.pos));return options[0]&&distance(p.pos,options[0].pos)<4?options[0]:null;
}
function renderPanel(){
 if(!panel||!state)return;const p=me(),w=state.wreck;let html='<button data-close>← BACK TO DECK</button><h2>'+panel.toUpperCase()+'</h2>';
 if(panel==='board')html+='<p>Accept contracts anywhere with C. Start with free contracts. Purchases use the shared account. Coordinates without rights produce illegal salvage.</p>'+state.leads.map(l=>'<article><strong>'+esc(l.name)+'</strong><p>'+esc(l.owner)+' · '+l.range+' fuel · '+esc(l.threat)+'</p>'+btn(l.accepted?'ACCEPTED':l.cost?'Buy · ₡'+l.cost:'Accept · FREE','accept',{id:l.id})+'</article>').join('');
 if(panel==='nav'){
  html+='<p>Captain commits travel. All crew must be aboard and crates put down. First station departure each quota is free; subsequent station departures and leaving salvaged wrecks cost one day.</p>';
  for(const target of [{id:'A',name:'Market A · industrial premium'},{id:'B',name:'Market B · technical / restricted'},...state.leads.filter(l=>l.accepted)])html+=btn('Travel: '+target.name,'travel',{id:target.id});
  html+='<article>'+btn('Ship cannon','shipfire')+btn('Boost escape · 10 fuel','boost')+btn('Pay police fine · ₡'+(state.encounter?.fine||0),'payfine')+btn('Fight police · 30s distress clock','fight')+'</article>';
  if(state.quota.due)html+=btn('Use one extension · +7 days, same quota','extend');
  html+=btn('Rescue tow: lose cargo, +₡300 quota +1 day','tow');
 }
 if(panel==='scanner'){
  if(!w)html+='<p>Travel to a wreck first.</p>';
  else{
   html+='<p>Lock grapple, then hold the mouse button on the scene and drag to rotate without screen edges. Press V while dragging to scan. Identification is optional: collect cargo whenever you want. Three matching clues give high confidence; five are certain.</p>'+btn(w.grapple?'Release grapple':'Lock grapple','grapple')+btn('V · Scan '+MODEL_KEYS[facingClue(w)],'scan');
   html+='<article>'+MODEL_KEYS.map(k=>'<p>'+k.toUpperCase()+': <strong>'+esc(w.clues[k]||'UNSCANNED')+'</strong></p>').join('')+'</article>';
   html+=catalog(w);
   html+='<article><p>Crunch destroys all cargo left in the wreck. Return every crew member to the ship first.</p><button data-crunch>CRUNCH WRECK…</button></article>';
  }
 }
 if(panel==='poster')html+='<p>Compare these manufacturer records to scanned clues. Cargo values are estimates, not guaranteed profit.</p>'+catalog(w);
 if(panel==='cargo'){
  html+='<p>Crates occupy real grid cells. Auto-stow finds a supported position; dimensions and shape must fit. Shielding protects only crates in that bay.</p>';
  for(const b of state.ship.containers){const d=holdDimensions(b),used=state.cargo.filter(c=>c.state==='secured'&&c.container===b.id).reduce((n,c)=>n+volume(c.dims),0);html+='<article><strong>'+b.name+' · '+used+'/'+volume(d)+' m³</strong><p>'+d.join('×')+'m · Shield '+b.shield+' · Detection '+Math.round(100*2**-b.shield)+'%</p>'+btn('Stow carried crate','secure',{container:b.id})+'</article>';}
  html+=state.cargo.filter(c=>c.state==='secured').map(c=>'<article>'+GOODS[c.type].name+' · '+c.dims.join('×')+'m'+(c.illegal?' · ILLEGAL':'')+btn('Jettison','jettison',{id:c.id})+'</article>').join('');
 }
 if(panel==='market'){
  html+='<p>Prices refresh with travel days. A favors industrial goods; B favors technology and accepts prohibited cargo. Sell first, then settle your quota.</p><table><tr><th>Cargo</th><th>A</th><th>B</th></tr>'+Object.entries(GOODS).map(([k,g])=>'<tr><td>'+g.name+'</td><td>'+state.prices.A[k]+'</td><td>'+state.prices.B[k]+'</td></tr>').join('')+'</table>';
  const crates=state.cargo.filter(c=>c.state==='secured');html+=btn('Sell all accepted cargo','sell',{ids:crates.map(c=>c.id)});
  for(const c of crates)html+=btn('Sell '+GOODS[c.type].name+' · '+volume(c.dims)+'m³','sell',{id:c.id});
  if(state.quota.due)html+='<article><p>Settlement deducts ₡'+state.quota.amount+'. If you cannot pay, the ship is repossessed and your account resets to ₡1,000.</p>'+btn('SETTLE QUOTA','settle')+btn('Use ship extension · +7 days','extend')+'</article>';
 }
 if(panel==='engineering'){
  html+=btn('Refuel +25 · ₡4/unit at A, ₡5 at B','refuel')+btn('Repair +25 · ₡3/HP docked, ₡5 underway','repair');
  html+='<article>'+Object.entries(UPGRADES).map(([key,u])=>btn(u.name+' '+state.ship.upgrades[key]+'/'+u.max+' · ₡'+u.cost*(state.ship.upgrades[key]+1),'upgrade',{key})).join('')+'</article><p>First shield conversion halves bay capacity. Later levels preserve that capacity and halve detection odds again. Empty a bay before conversion.</p>';
  for(const b of state.ship.containers)html+=btn(b.name+' shield L'+(b.shield+1)+' · ₡'+500*2**b.shield,'upgrade',{key:'shield',container:b.id});
 }
 setHTML('panel',html);
}
function catalog(w){return MODELS.map(m=>{const matched=MODEL_KEYS.filter((k,i)=>w?.clues[k]===m.clues[i]).length;return '<article><strong>'+m.name+'</strong><p>'+m.clues.map(esc).join(' / ')+'<br>'+m.owner+' · estimated ₡'+m.estimate+'<br>'+matched+'/5 matching clues</p>'+((panel==='scanner')?btn('Identify as '+m.name,'guess',{model:m.id}):'')+'</article>';}).join('');}
$('panel').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))openPanel(null);else if(b.hasAttribute('data-crunch')){b.outerHTML=btn('CONFIRM: destroy contents and crunch','crunch');}else if(b.dataset.action==='scan')scan();else if(b.dataset.action)action(b.dataset.action,JSON.parse(b.dataset.json||'{}'));};

$('world').onclick=()=>{if(state&&!panel)$('world').requestPointerLock();};
$('world').addEventListener('pointerdown',e=>{
 if(panel!=='scanner'||e.button!==0)return;
 e.preventDefault();drag=true;$('world').setPointerCapture(e.pointerId);
 const request=$('world').requestPointerLock();
 request?.catch(()=>toast('Cursor capture unavailable. Drag remains active until release.'));
});
window.addEventListener('pointerup',e=>{
 if(!drag)return;flushRotation();drag=false;
 if($('world').hasPointerCapture(e.pointerId))$('world').releasePointerCapture(e.pointerId);
 if(panel==='scanner')document.exitPointerLock();
});
window.addEventListener('pointercancel',()=>{drag=false;rotateDelta=0;});
$('world').addEventListener('pointerdown',e=>{
 if(panel||!state||!tractorEquipped||e.button!==0)return;
 const p=me();if(!p)return;
 if(p.tractor){action('tractorRelease');return;}
 const crate=view.targetCargo();
 if(crate){action('tractorAttach',{id:crate});} 
});
$('world').addEventListener('contextmenu',e=>{e.preventDefault();if(me()?.tractor)action('tractorRelease');});
window.addEventListener('wheel',e=>{
 if(!panel&&me()?.tractor){e.preventDefault();beamDistance=Math.max(2,Math.min(14,beamDistance+Math.sign(e.deltaY)*.6));}
},{passive:false});

document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)drag=false;});
window.addEventListener('mousemove',e=>{
 if(drag&&panel==='scanner'){
  rotateDelta=Math.max(-.15,Math.min(.15,rotateDelta+e.movementX*.005));
 }else if(document.pointerLockElement&&!panel){
  if(keys.KeyR&&me()?.tractor){beamAngle+=e.movementX*.012;}
  else{yaw-=e.movementX*.002;pitch=Math.max(-1.4,Math.min(1.4,pitch-e.movementY*.002));}
 }
});
window.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
 keys[e.code]=true;if(['Space','Tab'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(e.code==='Escape'){openPanel(null);keys={};}
 if(e.code==='KeyE'){if(panel){openPanel(null);return;}if(me()?.tractor){action('tractorSecure');return;}const n=nearest();if(n?.cargo)action('pickup',{id:n.cargo});else if(n)openPanel(n.key);}
 if(e.code==='KeyC')openPanel(panel==='board'?null:'board');
 if(e.code==='KeyT'){
  tractorEquipped=!tractorEquipped;
  if(!tractorEquipped&&me()?.tractor)action('tractorRelease');
  toast(tractorEquipped?'Tractor tool ready. Aim and left-click cargo.':'Tractor tool stowed.');
 }
 if(e.code==='KeyQ'){if(me()?.tractor)action('tractorRelease');else action('drop');}if(e.code==='KeyV'){e.preventDefault();scan();}
 if(e.code==='KeyF'){if(panel==='nav')action('shipfire');else{const p=me();const targets=(state?.wreck?.enemies||[]).filter(e=>e.hp>0).sort((a,b)=>distance(a.pos,p.pos)-distance(b.pos,p.pos));if(targets[0])action('shoot',{id:targets[0].id});}}
});
window.addEventListener('keyup',e=>delete keys[e.code]);window.addEventListener('blur',()=>{keys={};drag=false;rotateDelta=0;});
setInterval(()=>{flushRotation();if(state&&ws?.readyState===1)ws.send(JSON.stringify({type:'input',...(me()?.tractor?.id===activeTractor&&activeTractor?{tractorDistance:beamDistance,tractorAngle:beamAngle}:{}),x:panel?0:Number(!!keys.KeyD)-Number(!!keys.KeyA),z:panel?0:Number(!!keys.KeyW)-Number(!!keys.KeyS),y:panel?0:Number(!!keys.Space)-Number(!!keys.ControlLeft),sprint:!panel&&(!!keys.ShiftLeft||!!keys.ShiftRight),yaw,pitch}));},50);
const perf=document.createElement('div');perf.id='performance';
perf.style.cssText='position:fixed;bottom:38px;left:22px;color:#a9c3c9;font:11px monospace;pointer-events:none;background:#0b1824cc;padding:4px 8px';
document.body.append(perf);
let frames=0,longFrames=0,lastFrame=performance.now(),lastReport=lastFrame,lastSnapshot=0,snapshotGap=0,snapshotCount=0;
function animate(){
 const now=performance.now(),gap=now-lastFrame;lastFrame=now;frames++;if(gap>50)longFrames++;
 const w=state?.wreck;
 view.setScannerYaw(w?w.yaw+(rotationQueue.reduce((n,r)=>n+r.delta,0)+rotateDelta)*(1+(state.ship.upgrades.grapple||0)*.3):null);
 view.frame(yaw,pitch);
 if(now-lastReport>=1000){
  perf.textContent='crew v3 · '+Math.round(frames*1000/(now-lastReport))+' FPS · stalls >50ms: '+longFrames+' · updates '+snapshotCount+'/s · longest gap '+Math.round(snapshotGap)+'ms';
  frames=0;longFrames=0;snapshotCount=0;snapshotGap=0;lastReport=now;
 }
 requestAnimationFrame(animate);
}
animate();

$('contracts-anywhere').onclick=()=>openPanel(panel==='board'?null:'board');
$('copy-room').onclick=async()=>{
 if(!state)return;
 try{await navigator.clipboard.writeText(state.code);toast('Room code copied: '+state.code);}
 catch{toast('Room code: '+state.code+' — select and copy it from the top right.');}
};
