// Authoritative gameplay; no rendering or network dependencies.
export const VERSION = 1;
/** Server-authoritative settlement window after quota becomes due (seconds of sim time). */
export const QUOTA_SETTLEMENT_GRACE = 180;
export const MODEL_KEYS = ['thrusters','doors','paint','gear','brand'];
export const MODELS = [
 {id:'wren',name:'Wren Courier',owner:'Private courier',color:0xd19c58,clues:['Twin nacelles','Port side hatch','Ochre stripe','Tripod feet','Kestrel Works'],estimate:'600–1,400',size:1},
 {id:'mule',name:'Mule Utility',owner:'Small industrial operator',color:0x6c9f8a,clues:['Quad nacelles','Rear ramp','Green panels','Four skids','Kestrel Works'],estimate:'1,400–4,000',size:1.2},
 {id:'vault',name:'Vault Transport',owner:'Interstellar bank',color:0x91a6cb,clues:['Twin nacelles','Rear ramp','Blue panels','Four skids','Aster Foundry'],estimate:'4,000–12,000',size:1.5}
];
export const GOODS = {
 alloy:{name:'Alloy',dims:[1,1,1],value:120,group:'industrial',color:0x8e9caa},
 electronics:{name:'Electronics',dims:[1,1,1],value:240,group:'technical',color:0x64c9cc},
 medicine:{name:'Medical supplies',dims:[2,1,1],value:340,group:'technical',color:0xeeeecc},
 machinery:{name:'Machinery',dims:[2,1,2],value:560,group:'industrial',color:0xbe9a59},
 core:{name:'Data core',dims:[1,1,1],value:750,group:'technical',color:0x9181e1},
 illicit:{name:'Restricted weapon cores',dims:[1,1,1],value:900,group:'restricted',color:0xef6f76,illegal:true},
 reactor:{name:'Reactor assembly',dims:[4,4,8],value:18000,group:'industrial',color:0xe9af5b},
 scrap:{name:'Scrap',dims:[2,1,2],value:180,group:'industrial',color:0x9b8065}
};
export const UPGRADES = {
 weapon:{name:'Ship pulse cannon',cost:900,max:1},
 armor:{name:'Hull armor',cost:600,max:3},
 grapple:{name:'Grapple drive',cost:400,max:3},
 tank:{name:'Fuel tank',cost:500,max:2},
 hull:{name:'Larger salvage ship',cost:2400,max:2}
};
export const STATIONS = {
 board:[-3,0,-2],nav:[0,0,-8],scanner:[3,0,-6],
 market:[3,0,1],engineering:[-3,0,3],poster:[-3,0,-6],cargo:[0,0,3],hatch:[0,0,8.7]
};
export const REAR_HATCH = {z:10.4,width:8.2,height:3.2};
export const rearHatchHeight = s => REAR_HATCH.height + .5*(s.ship.upgrades.hull||0);
export const volume = d => d[0]*d[1]*d[2];
export const detectionChance = level => Math.pow(0.5,level);
export const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export const onShip = p => p.pos[0]>=-4.4 && p.pos[0]<=4.4 && p.pos[2]>=-10.2 && p.pos[2]<=10.2 && p.pos[1]<4;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function assert(ok,msg){if(!ok)throw Error(msg);}
function log(s,msg){s.log.unshift({at:s.time,text:msg});s.log.length=Math.min(9,s.log.length);}
function spend(s,n){assert(s.credits>=n,'Insufficient shared credits.');s.credits-=n;}
function station(s,p,key){assert(onShip(p)&&distance(p.pos,STATIONS[key])<4,'Walk to the '+key+' console first.');}
function captain(s,p){assert(s.captain===p.id,'Only the captain can commit this action.');}
export function makeShip(hull=0){
 const widths=[2,3,4],depths=[4,6,8];
 return {hull:100,maxHull:100,fuel:100,maxFuel:100,hatchOpen:false,
 upgrades:{weapon:0,armor:0,grapple:0,tank:0,hull},
 containers:[0,1].map(i=>({id:'bay'+i,name:i?'STARBOARD':'PORT',dims:[widths[hull],4,depths[hull]],shield:0})),
 extensionAvailable:true};
}
function leadList(){
 return [
 {id:'free-a',name:'Abandoned runabout',cost:0,model:0,range:10,legal:true,owner:'Private courier',threat:'Clear',goods:['alloy','electronics','medicine']},
 {id:'free-b',name:'Lost utility tender',cost:0,model:1,range:12,legal:true,owner:'Family freight business',threat:'Life signs',goods:['machinery','alloy','electronics']},
 {id:'paid-a',name:'Corporate supply wreck',cost:1000,model:1,range:18,legal:true,owner:'Vesta Logistics',threat:'Armed survivors',goods:['machinery','machinery','illicit','core','medicine']},
 {id:'unknown',name:'Unregistered coordinates',cost:0,model:0,range:15,legal:false,owner:'Unknown operator',threat:'Rival salvage vessel',goods:['core','illicit','electronics','medicine']},
 {id:'paid-b',name:'Bank transfer vessel',cost:8000,model:2,range:25,legal:true,owner:'Meridian Bank',threat:'Armed survivors',goods:['core','core','core','illicit','reactor']},
 {id:'million',name:'Sovereign reserve transport',cost:2000000,model:2,range:35,legal:true,owner:'Sovereign Bank',threat:'Rival salvage vessel',goods:['reactor','reactor','core','core']}
 ];
}
export function createGame(code,rng=Math.random){
 const s={code,version:VERSION,time:0,players:{},captain:null,credits:1000,ship:makeShip(),location:'A',phase:'docked',
 quota:{amount:1500,days:0,limit:7,freeDeparture:true,due:false,number:1,settleRemaining:null},
 leads:leadList(),wrecks:{},cargo:[],nextId:1,activeWreck:null,transit:null,encounter:null,combatVfx:null,
 marketDay:0,demand:{},log:[],rng,emptySince:null,run:1};
 log(s,'Welcome aboard. Accept a free contract at the board. First departure is free.');
 return s;
}
export function addPlayer(s,id,name){
 if(s.players[id]){s.players[id].connected=true;s.players[id].lastSeen=s.time;return;}
 assert(Object.keys(s.players).length<4,'Room has four reserved crew seats.');
 const n=Object.keys(s.players).length;
 s.players[id]={id,name:String(name||'Salvager').replace(/[<>&]/g,'').slice(0,18),pos:[n%2?2.7:-2.7,0,5+n],
 yaw:0,pitch:0,hp:100,stamina:100,sprintExhausted:false,held:null,tractor:null,input:{x:0,z:0,y:0},connected:true,lastSeen:s.time,fireAt:-10};
 s.captain??=id;
 log(s,s.players[id].name+' joined the crew.');
}
export function leavePlayer(s,id){
 const p=s.players[id];if(!p)return;
 p.connected=false;p.lastSeen=s.time;p.input={x:0,z:0,y:0};
 if(p.held){const c=s.cargo.find(c=>c.id===p.held);if(c){c.state='loose';c.carrier=null;c.pos=[...p.pos];}p.held=null;}
 releaseTractor(s,p);
 if(s.captain===id)s.captain=Object.values(s.players).find(x=>x.connected)?.id||id;
}
export function holdDimensions(c){return [c.dims[0],c.shield?c.dims[1]/2:c.dims[1],c.dims[2]];}
export function fits(s,cargo,containerId,cell,dims=cargo.dims){
 const box=s.ship.containers.find(c=>c.id===containerId);
 if(!box||cell.length!==3||dims.length!==3||!cell.every(Number.isInteger)||!dims.every(Number.isInteger))return false;
 if([...dims].sort((a,b)=>a-b).join()!=[...cargo.dims].sort((a,b)=>a-b).join())return false;
 const bounds=holdDimensions(box);
 if(cell.some((n,i)=>n<0||n+dims[i]>bounds[i]))return false;
 const overlaps=(a,ad,b,bd)=>a.every((n,i)=>n<b[i]+bd[i]&&n+ad[i]>b[i]);
 for(const other of s.cargo){
  if(other.id!==cargo.id&&other.state==='secured'&&other.container===containerId&&overlaps(cell,dims,other.cell,other.packedDims))return false;
 }
 // Stacking needs a supporting surface under every bottom cell.
 if(cell[1]>0){
  for(let x=cell[0];x<cell[0]+dims[0];x++)for(let z=cell[2];z<cell[2]+dims[2];z++){
   if(!s.cargo.some(o=>o.id!==cargo.id&&o.state==='secured'&&o.container===containerId&&o.cell[1]+o.packedDims[1]===cell[1]&&x>=o.cell[0]&&x<o.cell[0]+o.packedDims[0]&&z>=o.cell[2]&&z<o.cell[2]+o.packedDims[2]))return false;
  }
 }
 return true;
}
export function findSlot(s,cargo,containerId){
 const box=s.ship.containers.find(c=>c.id===containerId);if(!box)return null;
 const b=holdDimensions(box),d=cargo.dims;
 for(const dims of [d,[d[2],d[1],d[0]],[d[0],d[2],d[1]],[d[1],d[0],d[2]],[d[1],d[2],d[0]],[d[2],d[0],d[1]]])
  for(let y=0;y<=b[1]-dims[1];y++)for(let z=0;z<=b[2]-dims[2];z++)for(let x=0;x<=b[0]-dims[0];x++)
   if(fits(s,cargo,containerId,[x,y,z],dims))return {cell:[x,y,z],dims};
 return null;
}
export function marketPrice(s,type,market=s.location){
 const g=GOODS[type];if(!g||!['A','B'].includes(market))return 0;
 if(g.illegal&&market==='A')return 0;
 const demand=s.demand[market+':'+type]||0;
 const preferred=market==='A'?'industrial':'technical';
 const mult=g.group==='restricted'?1.1:g.group===preferred?1.3:0.85;
 const daily=1+(((s.marketDay+(market==='A'?0:2)+Object.keys(GOODS).indexOf(type))%5)-2)*0.04;
 return Math.floor(g.value*mult*daily*(demand>=4?0.75:1));
}
// Greedy packing conserves volume; ship capacity does not shrink the wreck's output.
export const SCRAP_SIZES=[[4,4,8],[4,4,4],[4,2,4],[2,2,4],[2,2,2],[2,1,2],[2,1,1],[1,1,1]];
export function scrapCrates(total){
 assert(Number.isSafeInteger(total)&&total>=0&&total<=100000,'Invalid scrap volume.');
 const result=[];
 for(const dims of SCRAP_SIZES)while(total>=volume(dims)){result.push([...dims]);total-=volume(dims);}
 return result;
}
export function cargoValue(c){return GOODS[c.type].value*(c.type==='scrap'?volume(c.dims)/volume(GOODS.scrap.dims):1);}
export function cargoPrice(s,c,market=s.location){return Math.floor(marketPrice(s,c.type,market)*(c.type==='scrap'?volume(c.dims)/volume(GOODS.scrap.dims):1));}
function makeCargo(s,type,source,pos,legal=true){
 const g=GOODS[type],c={id:'c'+s.nextId++,type,dims:[...g.dims],source,illegal:!!g.illegal||!legal,
 state:'loose',carrier:null,container:null,cell:null,packedDims:null,pos:[...pos],angle:0,salvaged:false};
 s.cargo.push(c);return c;
}
function spawnWreck(s,lead){
 if(s.wrecks[lead.id])return s.wrecks[lead.id];
 const w={id:lead.id,model:lead.model,owner:lead.owner,yaw:0,pitch:0,grapple:false,crunched:false,crunchAt:0,
 scrapVolume:[16,40,160][lead.model],clues:{},guess:null,taken:false,legal:lead.legal,enemies:[],rivalHP:lead.threat==='Rival salvage vessel'?80:0,rivalDestroyed:false};
 const hostile=lead.threat==='Life signs'?'creature':lead.threat==='Armed survivors'?'survivor':lead.threat==='Rival salvage vessel'?'rival':null;
 if(hostile)w.enemies.push({id:'e'+s.nextId++,kind:hostile,pos:[0,0,-34],hp:hostile==='creature'?60:80,nextAttack:s.time+3});
 s.wrecks[lead.id]=w;
 lead.goods.forEach((type,i)=>makeCargo(s,type,lead.id,[-3+(i%3)*3,0,-28-Math.floor(i/3)*4],lead.legal));
 return w;
}
function requireActive(s){assert(s.phase==='salvage'&&s.activeWreck,'Travel to a wreck first.');return s.wrecks[s.activeWreck];}
export function facingClue(w){
 const a=((w.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
 return Math.round(a/(Math.PI*2)*5)%5;
}
function inWreck(p){return Math.abs(p.pos[0])<8&&p.pos[2]<-23&&p.pos[2]>-45&&p.pos[1]<7;}
export function illegalValue(s,ids=null){return s.cargo.filter(c=>c.illegal&&c.state!=='lost'&&c.state!=='sold'&&c.state!=='destroyed'&&(!ids||ids.includes(c.id))).reduce((n,c)=>n+cargoValue(c),0);}
function aboardCargo(s,c){return c.state==='secured'||(['held','tractored'].includes(c.state)&&onShip(s.players[c.carrier]||{pos:[99,99,99]}))||(c.state==='loose'&&onShip({pos:c.pos}));}
export function policeScan(s){
 const rolls=new Map(),caught=[];
 for(const c of s.cargo){
  if(!c.illegal||!aboardCargo(s,c))continue;
  const box=c.state==='secured'?s.ship.containers.find(b=>b.id===c.container):null;
  if(!box||!box.shield){caught.push(c.id);continue;}
  if(!rolls.has(box.id))rolls.set(box.id,s.rng()<detectionChance(box.shield));
  if(rolls.get(box.id))caught.push(c.id);
 }
 return caught;
}
function nextQuota(s){
 s.quota={amount:Math.ceil(s.quota.amount*1.35/50)*50,days:0,limit:7,freeDeparture:true,due:false,number:s.quota.number+1,settleRemaining:null};
 s.demand={};log(s,'Quota paid. New seven-day obligation: '+s.quota.amount+' credits.');
 // Refresh depleted contract opportunities only between quotas, keeping every retained cargo ID unique.
 for(const l of s.leads){if(l.visited){l.id=l.id+'q'+s.quota.number;l.accepted=false;l.visited=false;}}
}
/** Mark quota due once and start the settlement grace countdown (idempotent). */
export function markQuotaDue(s,reason){
 if(s.quota.due){
  if(s.quota.settleRemaining==null)s.quota.settleRemaining=QUOTA_SETTLEMENT_GRACE;
  return false;
 }
 s.quota.due=true;
 s.quota.settleRemaining=QUOTA_SETTLEMENT_GRACE;
 log(s,reason||('QUOTA DUE: day '+s.quota.limit+'/'+s.quota.limit+'. Return to a market within '+QUOTA_SETTLEMENT_GRACE+'s; payment is automatic when funds are available.'));
 return true;
}
// A quota is collected as soon as the crew is solvent at a market. A crew
// arriving short of funds may sell its already-secured salvage before payment.
// Repeated server ticks are idempotent because nextQuota clears due.
function autoSettleQuota(s){
 if(!s.quota.due||s.phase!=='docked'||!['A','B'].includes(s.location)||s.credits<s.quota.amount)return false;
 const payment=s.quota.amount;
 s.credits-=payment;
 nextQuota(s);
 log(s,'AUTOMATIC QUOTA PAYMENT: '+payment+' credits deducted.');
 return true;
}
export function settleQuota(s,useExtension=false){
 assert(s.quota.due,'Payment is not due yet.');
 if(useExtension){
  assert(s.ship.extensionAvailable,'This ship already used its extension.');
  s.ship.extensionAvailable=false;s.quota.limit+=7;s.quota.due=false;s.quota.settleRemaining=null;
  log(s,'Extension used. Seven additional travel days for the SAME quota.');return;
 }
 assert(['A','B'].includes(s.location),'Dock at a market to settle, or use your extension.');
 if(s.credits>=s.quota.amount){s.credits-=s.quota.amount;nextQuota(s);}
 else resetRun(s);
}
function resetRun(s,reason){
 const fresh=createGame(s.code,s.rng),players=s.players,captainId=s.captain,time=s.time,run=s.run+1;
 Object.assign(s,fresh,{players,captain:captainId,time,run});
 for(const p of Object.values(players)){p.pos=[2.8,0,5];p.hp=100;p.stamina=100;p.sprintExhausted=false;p.held=null;p.tractor=null;}
 log(s,reason||'REPOSSESSED. Fresh starter ship; shared account reset to 1,000 credits.');
}
/** Clear a resolved encounter and any lingering combat flash so travel can resume. */
function clearEncounter(s){s.encounter=null;s.combatVfx=null;}
function confiscateCaughtCargo(s,ids){
 const want=new Set(ids||[]);
 let count=0;
 for(const c of s.cargo){
  if(!want.has(c.id)||['sold','lost','destroyed'].includes(c.state))continue;
  if(c.carrier){
   const carrier=s.players[c.carrier];
   if(carrier){
    if(carrier.tractor?.id===c.id)carrier.tractor=null;
    if(carrier.held===c.id)carrier.held=null;
   }
   c.carrier=null;
  }
  c.state='lost';c.velocity=null;count++;
 }
 return count;
}
export function destroyShip(s){
 for(const p of Object.values(s.players))releaseTractor(s,p);
 const fine=s.encounter?.fine||0;s.credits=Math.max(0,s.credits-fine);
 s.ship=makeShip();for(const c of s.cargo)if(aboardCargo(s,c))c.state='lost';
 s.cargo=s.cargo.filter(c=>!['lost','sold','destroyed'].includes(c.state));
 s.location='A';s.phase='docked';s.transit=null;s.encounter=null;s.combatVfx=null;s.activeWreck=null;
 for(const p of Object.values(s.players)){p.pos=[2.8,0,5];p.hp=100;p.stamina=100;p.sprintExhausted=false;p.held=null;p.tractor=null;}
 log(s,'Ship destroyed. Starter restored; credits retained minus '+fine+' in outstanding fines. Quota clock is unchanged.');
}
function beginEncounter(s){
 const r=s.rng();
 if(s.quota.days<1||r>0.55)return;
 if(r<0.3){s.encounter={type:'police',stage:'warning',until:s.time+20,hp:100,fine:0,caught:[],nextShot:0,startedAt:s.time,lastShotAt:null,lastPlayerShotAt:null};log(s,'POLICE: scan begins in 20 seconds, then runs for 5 seconds.');}
 else{s.encounter={type:'raider',stage:'attack',until:s.time+25,hp:80,fine:0,nextShot:s.time+5,startedAt:s.time,lastShotAt:null,lastPlayerShotAt:null};log(s,'RAIDER INTERCEPT. Fire from navigation console, repair, or boost away.');}
}
// Tractor cargo has server-owned bottom-center world coordinates.
const TRACTOR_RANGE=14, TRACTOR_SPEED=18;
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function releaseTractor(s,p){if(!p.tractor)return;const c=s.cargo.find(c=>c.id===p.tractor.id);if(c&&c.state==='tractored'&&c.carrier===p.id){
 c.state='loose';c.carrier=null;
 if(onShip({pos:c.pos})){c.pos[1]=0;c.velocity=null;}
 else c.velocity=[-Math.sin(p.yaw)*.22,0,-Math.cos(p.yaw)*.22];
}p.tractor=null;}
const boxDims=c=>{const a=wrapAngle(c.angle||0),x=c.dims[0],z=c.dims[2];return [Math.abs(Math.cos(a))*x+Math.abs(Math.sin(a))*z,c.dims[1],Math.abs(Math.sin(a))*x+Math.abs(Math.cos(a))*z];};
// Aft opening is a real portal: a crate must physically clear the frame.
// Side airlock stays available for small salvage and crew EVA.
export function cargoMoveValid(s,c,from,pos){
 if(!pos.every(finite)||pos[1]<0||pos[1]+c.dims[1]>18||Math.abs(pos[0])>65||pos[2]<-65||pos[2]>30)return false;
 const d=boxDims(c),hx=d[0]/2,hz=d[2]/2;
 const inside=p=>p[0]>-4.4&&p[0]<4.4&&p[2]>-10.4&&p[2]<REAR_HATCH.z;
 const side=p=>p[0]>3.2&&p[0]<6.6&&p[2]>5.5&&p[2]<9.4&&d[0]<=2.2&&d[2]<=3.8&&p[1]+d[1]<=3.3;
 // Allow the WHOLE crate to cross the aft plane. The old center-distance cutoff
 // became false halfway through a doorway and trapped freight against an invisible wall.
 const aftSweep=Math.min(from[2]-hz,pos[2]-hz)<REAR_HATCH.z&&Math.max(from[2]+hz,pos[2]+hz)>REAR_HATCH.z;
 const rear=s.ship.hatchOpen&&aftSweep&&
  Math.abs(pos[0])+hx<=REAR_HATCH.width/2+.001 &&
  Math.abs(from[0])+hx<=REAR_HATCH.width/2+.001 &&
  pos[1]+d[1]<=rearHatchHeight(s)+.001&&from[1]+d[1]<=rearHatchHeight(s)+.001;
 const fromInside=inside(from),toInside=inside(pos);
 if(fromInside!==toInside&&!rear&&!side(from)&&!side(pos))return false;
 // A crate spanning the rear hull intersects the actual closed hatch.
 if(aftSweep&&!rear&&Math.abs(pos[0])<5&&Math.abs(from[0])<5)return false;
 // No cargo may phase through the sealed bow or the remaining ship walls.
 if(toInside){
  if(pos[2]-hz< -10.35)return false;
  if(pos[0]-hx< -4.35||pos[0]+hx>4.35){
   if(!side(from)&&!side(pos))return false;
  }
  if(pos[2]+hz>REAR_HATCH.z&&!rear)return false;
  if(pos[1]+d[1]>rearHatchHeight(s)+.1&&!rear)return false;
 }
 for(const o of s.cargo){
  if(o.id===c.id||!['loose','secured','tractored'].includes(o.state))continue;
  let op=o.pos,od=boxDims(o);
  if(o.state==='secured'){
   const bay=s.ship.containers.find(b=>b.id===o.container);if(!bay)continue;
   const i=s.ship.containers.indexOf(bay);od=o.packedDims;
   op=[(i===0?-bay.dims[0]:0)+o.cell[0]+od[0]/2,o.cell[1],o.cell[2]+od[2]/2];
  }
  if(Math.abs(pos[0]-op[0])<(d[0]+od[0])/2-.04&&Math.abs(pos[2]-op[2])<(d[2]+od[2])/2-.04&&pos[1]<op[1]+od[1]-.04&&pos[1]+d[1]>op[1]+.04)return false;
 }
 return true;
}
// Assist a floor/grid drop without teleporting cargo through the ship's hull.
// E uses the closest supported physical bay cell within a short magnetic radius.
// A full bay is defined by its dimensions, not by volume alone.
// The cargo grid automatically rolls/tips a loose crate when a 90-degree
// orientation is necessary (e.g. 4x2x4 scrap into a 2x4x4 starter bay).
// These are the six axis-aligned box orientations; invalid ones never fit().
function cargoOrientations(c){
 const [x,y,z]=c.dims,swap=Math.abs(Math.round((c.angle||0)/(Math.PI/2))%2)===1;
 const yawDims=swap?[z,y,x]:[x,y,z];
 const base=[{dims:yawDims,autoRotate:false}];
 const seen=new Set([yawDims.join(',')]);
 for(const dims of [[x,y,z],[z,y,x],[x,z,y],[y,x,z],[y,z,x],[z,x,y]]){
  const key=dims.join(',');
  if(!seen.has(key)){seen.add(key);base.push({dims,autoRotate:dims[1]!==y});}
 }
 return base;
}
export function tractorSlot(s,c){
 if(!c||c.state!=='tractored')return null;
 const d=boxDims(c);
 const fullyInside=c.pos[0]-d[0]/2>=-4.35&&c.pos[0]+d[0]/2<=4.35&&
  c.pos[2]-d[2]/2>=-10.35&&c.pos[2]+d[2]/2<=10.35&&
  c.pos[1]>=0&&c.pos[1]+d[1]<=rearHatchHeight(s)+.1;
 if(!fullyInside)return null;
 const quarter=Math.PI/2,turn=Math.round((c.angle||0)/quarter);
 const mismatch=Math.abs(wrapAngle((c.angle||0)-turn*quarter));
 const MAX_SNAP=2.6,MAX_ANGLE=.62;
 let best=null;
 for(let i=0;i<s.ship.containers.length;i++){
  const bay=s.ship.containers[i],bounds=holdDimensions(bay),origin=i===0?-bay.dims[0]:0;
  for(const orientation of cargoOrientations(c)){
   const {dims,autoRotate}=orientation;
   if(dims.some((v,axis)=>v>bounds[axis]))continue;
   for(let y=0;y<=bounds[1]-dims[1];y++)
    for(let z=0;z<=bounds[2]-dims[2];z++)
     for(let x=0;x<=bounds[0]-dims[0];x++){
      const cell=[x,y,z];
      if(!fits(s,c,bay.id,cell,dims))continue;
      const pos=[origin+x+dims[0]/2,y,z+dims[2]/2];
      const offset=distance(c.pos,pos);
      if(offset>MAX_SNAP)continue;
      const valid=mismatch<=MAX_ANGLE,score=offset+y*.12+(autoRotate?.18:0);
      if(!best||(valid&&!best.valid)||(valid===best.valid&&score<best.score))
       best={container:bay.id,cell,dims,pos,valid,offset,score,autoRotate};
     }
  }
 }
 return best;
}
export function setInput(s,id,input){
 const p=s.players[id];if(!p||!p.connected)return;
 p.input={x:clamp(finite(input.x)?input.x:0,-1,1),z:clamp(finite(input.z)?input.z:0,-1,1),y:clamp(finite(input.y)?input.y:0,-1,1),sprint:input.sprint===true};
 if(finite(input.yaw))p.yaw=input.yaw%(Math.PI*2);
 if(finite(input.pitch))p.pitch=clamp(input.pitch,-1.4,1.4);
 if(p.tractor){
  if(finite(input.tractorDistance))p.tractor.targetDistance=clamp(input.tractorDistance,2,TRACTOR_RANGE);
  if(finite(input.tractorAngle))p.tractor.targetAngle=wrapAngle(input.tractorAngle);
 }
 p.lastSeen=s.time;
}
export function act(s,id,a){
 const p=s.players[id];assert(p&&p.connected,'Crew member is not connected.');
 assert(a&&typeof a.type==='string','Invalid action.');
 switch(a.type){
 case 'accept':{
  // Contracts are available through the crew handheld from any location.
  const l=s.leads.find(l=>l.id===a.id);assert(l&&!l.accepted,'Contract unavailable or already accepted.');
  spend(s,l.cost);l.accepted=true;log(s,p.name+' accepted '+l.name+(l.legal?' (authorized).':' (UNAUTHORIZED).'));break;
 }
 case 'travel':{
  station(s,p,'nav');captain(s,p);
  assert(!s.ship.hatchOpen,'Close the rear cargo hatch before travel.');assert(!s.transit&&!s.encounter,'Finish the current encounter first.');
  assert(!s.quota.due||['A','B'].includes(a.id),'Quota due: return to Market A or B to sell and settle, or use your extension.');
  assert(Object.values(s.players).filter(p=>p.connected).every(onShip),'All connected crew must be aboard.');
  assert(!s.cargo.some(c=>c.state==='tractored'),'Release and secure tractor cargo before departure.');
  assert(!s.cargo.some(c=>c.state==='loose'&&onShip({pos:c.pos})),
   'Unsecured cargo aboard: use the tractor to secure it or jettison it at the cargo console before departure.');
  const target=a.id;assert(target!==s.location,'Already at this destination.');
  let fuel=10;
  if(!['A','B'].includes(target)){
   const l=s.leads.find(l=>l.id===target&&l.accepted);assert(l,'Accept that contract first.');
   fuel=l.range;assert(!s.wrecks[target]?.crunched,'That wreck has already been crunched.');
  }
  assert(s.ship.fuel>=fuel,'Not enough fuel. Refuel or call a rescue tow.');
  const from=s.location,w=s.activeWreck?s.wrecks[s.activeWreck]:null;
  let count=0;
  if(['A','B'].includes(from)){if(s.quota.freeDeparture)s.quota.freeDeparture=false;else count=1;}
  else if(w?.taken)count=1;
  s.ship.fuel-=fuel;
  s.quota.days=Math.min(s.quota.limit,s.quota.days+count);s.marketDay+=count;
  if(s.quota.days>=s.quota.limit)markQuotaDue(s);
  s.transit={target,arrival:s.time+8,count,from};s.phase='transit';
  if(w)w.grapple=false;
  if(!['A','B'].includes(from)&&w?.taken)beginEncounter(s);
  log(s,'Departing for '+(['A','B'].includes(target)?'Market '+target:'salvage coordinates')+'. '+count+' quota day used.');break;
 }
 case 'cargoHatch':{
  assert(s.phase!=='transit','The cargo hatch cannot be operated during transit.');
  const nearInterior=onShip(p)&&(distance(p.pos,STATIONS.hatch)<4||distance(p.pos,STATIONS.cargo)<4);
  const nearExterior=distance(p.pos,[0,0,12.3])<4;
  assert(nearInterior||nearExterior,'Operate the hatch from the aft switch or cargo console.');
  if(s.ship.hatchOpen){
   const blocked=s.cargo.some(c=>{
    if(!['loose','tractored','held'].includes(c.state))return false;
    const d=boxDims(c);
    return c.pos[2]-d[2]/2<REAR_HATCH.z+.1&&c.pos[2]+d[2]/2>REAR_HATCH.z-.1&&Math.abs(c.pos[0])<REAR_HATCH.width/2+d[0]/2;
   });
   assert(!blocked,'A crate is obstructing the rear cargo hatch.');
   assert(!Object.values(s.players).some(q=>q.connected&&Math.abs(q.pos[2]-REAR_HATCH.z)<.55&&Math.abs(q.pos[0])<REAR_HATCH.width/2),'A crew member is standing in the hatch.');
  }
  s.ship.hatchOpen=!s.ship.hatchOpen;
  log(s,p.name+(s.ship.hatchOpen?' opened':' closed')+' the aft cargo hatch.');break;
 }
 case 'grapple':{
  station(s,p,'scanner');const w=requireActive(s);assert(!w.crunched,'Nothing remains to grapple.');
  assert(!Object.values(s.players).some(p=>p.connected&&inWreck(p)),'Crew is aboard the wreck.');
  w.grapple=!w.grapple;log(s,w.grapple?'Grapple locked. Drag in scanner to rotate; V scans.':'Grapple released.');break;
 }
 case 'rotate':{
  station(s,p,'scanner');const w=requireActive(s);assert(w.grapple&&!w.crunched,'Lock the grapple first.');
  assert(!Object.values(s.players).some(p=>p.connected&&!onShip(p)),'Rotation locked while crew is outside.');
  w.yaw+=clamp(finite(a.delta)?a.delta:0,-0.15,0.15)*(1+s.ship.upgrades.grapple*.3);
  if(Number.isSafeInteger(a.rotationId)&&a.rotationId>=0){w.rotationAcks??={};w.rotationAcks[p.id]=a.rotationId;}break;
 }
 case 'scan':{
  station(s,p,'scanner');const w=requireActive(s);assert(w.grapple&&!w.crunched,'Lock the grapple first.');
  const k=facingClue(w);w.clues[MODEL_KEYS[k]]=MODELS[w.model].clues[k];log(s,'Scanned '+MODEL_KEYS[k]+': '+MODELS[w.model].clues[k]);break;
 }
 case 'guess':{
  station(s,p,'scanner');const w=requireActive(s);
  assert(Object.keys(w.clues).length>=3,'Scan at least three categories first.');
  assert(MODELS.some(m=>m.id===a.model),'Unknown model.');w.guess=a.model;
  log(s,'Crew hypothesis: '+MODELS.find(m=>m.id===a.model).name+'. Compare all five clues for certainty.');break;
 }
 case 'tractorAttach':{
  assert(s.phase==='salvage'||s.phase==='docked','Tractor cargo requires a salvage site or market dock.');
  assert(!p.held&&!p.tractor,'Release your current cargo first.');
  const c=s.cargo.find(c=>c.id===a.id&&c.state==='loose');assert(c,'Cargo is not available.');
  const center=[c.pos[0],c.pos[1]+c.dims[1]/2,c.pos[2]],origin=[p.pos[0],p.pos[1]+1.6,p.pos[2]];
  const v=center.map((n,i)=>n-origin[i]),len=Math.hypot(...v);
  assert(len>=.5&&len<=TRACTOR_RANGE,'Crate outside tractor range.');
  const forward=[-Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch)];
  const dot=v.reduce((sum,n,i)=>sum+n*forward[i],0),perp=Math.sqrt(Math.max(0,len*len-dot*dot));
  assert(dot>0&&perp<=Math.max(1,Math.max(...c.dims)*.6),'Aim directly at the crate.');
  if(s.phase==='docked')assert(onShip({pos:c.pos})&&onShip(p),'Only crates aboard the ship can be retrieved while docked.');
  c.state='tractored';c.carrier=p.id;
  p.tractor={id:c.id,distance:clamp(len,2,TRACTOR_RANGE),targetDistance:clamp(len,2,TRACTOR_RANGE),angle:c.angle||0,targetAngle:c.angle||0};
  if(s.phase==='salvage'&&!c.salvaged){const w=requireActive(s);c.salvaged=true;w.taken=true;}
  break;
 }
 case 'tractorRelease':{assert(p.tractor,'No cargo attached.');releaseTractor(s,p);break;}
 case 'tractorSecure':{
  assert(p.tractor,'Attach cargo first.');assert(onShip(p),'Move into the cargo hold first.');
  const c=s.cargo.find(c=>c.id===p.tractor.id&&c.carrier===p.id);assert(c,'Tractor attachment lost.');
  assert(distance(p.pos,c.pos)<7,'Move closer to the crate.');
  const slot=tractorSlot(s,c);assert(slot?.valid,'Move the entire crate inside the hold and near a free green floor/grid slot, then press E.');
  c.state='secured';c.container=slot.container;c.cell=slot.cell;c.packedDims=slot.dims;
  c.angle=Math.round(c.angle/(Math.PI/2))*(Math.PI/2);c.carrier=null;p.tractor=null;
  log(s,GOODS[c.type].name+' secured in '+s.ship.containers.find(b=>b.id===slot.container).name+'.');break;
 }
 case 'jettison':{
  station(s,p,'cargo');
  const c=s.cargo.find(c=>c.id===a.id&&(c.state==='secured'||(c.state==='loose'&&onShip({pos:c.pos}))));
  assert(c,'Cargo is not aboard or cannot be jettisoned.');
  if(c.state==='secured')assert(!s.cargo.some(o=>o!==c&&o.state==='secured'&&o.container===c.container&&o.cell[1]>=c.cell[1]+c.packedDims[1]),'Unload top crates first.');
  c.state='lost';c.velocity=null;log(s,GOODS[c.type].name+' jettisoned.');break;
 }
 case 'crunch':{
  station(s,p,'scanner');captain(s,p);const w=requireActive(s);
  assert(w.grapple&&!w.crunched&&!w.crunchAt,'Lock an intact wreck first.');
  assert(Object.values(s.players).filter(p=>p.connected).every(onShip),'All crew must be aboard before Crunch.');
  assert(!s.cargo.some(c=>['held','tractored'].includes(c.state)),'Put down carried cargo first.');
  w.crunchAt=s.time+3;log(s,'CRUNCH: blast shutters closed. Everything left inside will be destroyed.');break;
 }
 case 'sell':{
  station(s,p,'market');assert(s.phase==='docked','Dock at a market to sell.');
  const ids=Array.isArray(a.ids)?a.ids:[a.id];let total=0,count=0;
  for(const c of s.cargo){
   if(!ids.includes(c.id)||c.state!=='secured')continue;
   const price=cargoPrice(s,c);if(!price)continue;
   c.state='sold';total+=price;count++;s.demand[s.location+':'+c.type]=(s.demand[s.location+':'+c.type]||0)+1;
  }
  assert(count>0,'No saleable secured cargo selected. Market A refuses prohibited goods.');
  s.credits+=total;log(s,count+' crate(s) sold for '+total+' credits.');
  autoSettleQuota(s);break;
 }
 case 'refuel':{
  station(s,p,'engineering');assert(s.phase==='docked','Refuel at a market.');
  const amount=Math.min(25,s.ship.maxFuel-s.ship.fuel);assert(amount>0,'Fuel tank is full.');
  spend(s,amount*(s.location==='A'?4:5));s.ship.fuel+=amount;break;
 }
 case 'repair':{
  station(s,p,'engineering');
  const amount=Math.min(25,s.ship.maxHull-s.ship.hull);assert(amount>0,'Hull is intact.');
  assert(s.time-(s.lastRepair??-10)>=3,'Repair system cooling down.');
  spend(s,amount*(s.phase==='docked'?3:5));s.ship.hull+=amount;s.lastRepair=s.time;break;
 }
 case 'upgrade':{
  station(s,p,'engineering');captain(s,p);assert(s.phase==='docked','Upgrade at a market.');
  if(a.key==='shield'){
   const c=s.ship.containers.find(c=>c.id===a.container);assert(c,'Choose a bay.');
   assert(c.shield<6,'Prototype maximum shielding reached.');
   if(!c.shield)assert(!s.cargo.some(x=>x.state==='secured'&&x.container===c.id),'Empty the bay before its first shield conversion.');
   spend(s,500*Math.pow(2,c.shield));c.shield++;
   log(s,c.name+' shielding level '+c.shield+'. Capacity stays at 50% of standard.');break;
  }
  const u=UPGRADES[a.key];assert(u&&s.ship.upgrades[a.key]<u.max,'Upgrade unavailable.');
  if(a.key==='hull')assert(!s.cargo.some(c=>['held','tractored'].includes(c.state)),'Secure cargo first.');
  const level=s.ship.upgrades[a.key];spend(s,u.cost*(level+1));s.ship.upgrades[a.key]++;
  if(a.key==='armor'){s.ship.maxHull+=50;s.ship.hull+=50;}
  if(a.key==='tank')s.ship.maxFuel+=50;
  if(a.key==='hull'){
   assert(!s.cargo.some(c=>['held','tractored'].includes(c.state)),'Secure cargo first.');
   const replacement=makeShip(level+1);
   s.ship.containers.forEach((c,i)=>c.dims=replacement.containers[i].dims);
   s.ship.extensionAvailable=true; // A new hull is a new ship; other purchased upgrades transfer in this prototype.
  }
  log(s,u.name+' purchased.');break;
 }
 case 'settle':station(s,p,'market');captain(s,p);settleQuota(s,false);break;
 case 'extend':captain(s,p);assert(onShip(p),'Return to ship first.');settleQuota(s,true);break;
 case 'payfine':{
  captain(s,p);const e=s.encounter;assert(e?.type==='police'&&e.stage==='fine','No payable citation.');
  assert(!e.resolved,'Citation already resolved.');
  spend(s,e.fine);e.resolved=true;
  log(s,'Fine paid: '+e.fine+'. Cited cargo released for this inspection.');
  clearEncounter(s);break;
 }
 case 'surrender':{
  captain(s,p);const e=s.encounter;
  assert(e?.type==='police'&&e.stage==='fine','No confiscation offer.');
  assert(!e.resolved,'Citation already resolved.');
  assert(Array.isArray(e.caught)&&e.caught.length,'No detected cargo to surrender.');
  e.resolved=true;
  const count=confiscateCaughtCargo(s,e.caught);
  log(s,'Detected cargo surrendered ('+count+' crate(s)). Fine of '+e.fine+' waived; ship released.');
  // Always clear even if crates were already gone — prevents a soft-lock after a raced resolve.
  clearEncounter(s);break;
 }
 case 'fight':{
  station(s,p,'nav');captain(s,p);const e=s.encounter;
  assert(e?.type==='police'&&e.stage==='fine','No police confrontation.');
  assert(!e.resolved,'Citation already resolved.');
  assert(s.ship.upgrades.weapon,'Starter ship is unarmed. Install a cannon first.');
  e.stage='fight';e.until=s.time+30;e.nextShot=s.time+4;log(s,'POLICE distress transmission in 30 seconds.');break;
 }
 case 'shipfire':{
  station(s,p,'nav');assert(s.ship.upgrades.weapon,'Ship has no weapon installed.');
  assert(s.time-(s.lastShipFire??-5)>=.8,'Cannon recharging.');s.lastShipFire=s.time;
  const e=s.encounter;
  if(e){assert(e.stage==='fight'||e.type==='raider','Choose fight before firing.');e.hp-=12;e.lastPlayerShotAt=s.time;
   if(e.hp<=0){
    const police=e.type==='police';s.combatVfx={type:e.type,at:s.time,kind:'destroyed'};s.encounter=null;s.transit=null;s.phase='salvage';
    const id='defeated-'+s.nextId++,lead={id,model:police?2:1,owner:police?'Space Police':'Raiders',legal:false,threat:'Clear',goods:['alloy','electronics','illicit']};
    spawnWreck(s,lead);s.activeWreck=id;s.location=id;log(s,'Hostile vessel disabled. Its salvage is UNAUTHORIZED.');}
  }else{
   const w=requireActive(s);assert(w.rivalHP>0,'No hostile vessel targeted.');w.rivalHP-=12;
   if(w.rivalHP<=0){w.rivalDestroyed=true;for(let i=0;i<3;i++)makeCargo(s,i===2?'scrap':'electronics','rival-'+w.id,[9,0,-27-i*3],false);log(s,'Rival ship destroyed. Additional unauthorized salvage outside the wreck.');}
  }break;
 }
 case 'boost':{
  station(s,p,'nav');assert(s.encounter?.type==='raider','Boost escape is available during a raider attack.');
  assert(s.ship.fuel>=10,'Need 10 fuel to boost.');s.ship.fuel-=10;clearEncounter(s);log(s,'Boost escape successful.');break;
 }
 case 'shoot':{
  assert(s.phase==='salvage','No on-foot target here.');assert(s.time-p.fireAt>=.3,'Sidearm cycling.');
  const w=requireActive(s),e=w.enemies.find(e=>e.id===a.id&&e.hp>0);assert(e,'No living target.');
  const d=distance(p.pos,e.pos);assert(!onShip(p)&&d<24,'Target out of sidearm range.');
  const dx=e.pos[0]-p.pos[0],dz=e.pos[2]-p.pos[2],dot=(-Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz)/Math.max(.01,Math.hypot(dx,dz));
  assert(dot>.9,'Aim at the hostile.');p.fireAt=s.time;e.hp-=25;break;
 }
 case 'tow':{
  station(s,p,'nav');captain(s,p);assert(!s.encounter,'Resolve the encounter before calling a tow.');
  for(const c of s.cargo)if(aboardCargo(s,c))c.state='lost';
  s.quota.amount+=300;s.ship.fuel=Math.max(20,s.ship.fuel);
  s.quota.days=Math.min(s.quota.limit,s.quota.days+1);
  s.marketDay++;s.location='A';s.phase='docked';s.transit=null;s.activeWreck=null;
  if(s.quota.days>=s.quota.limit)markQuotaDue(s);
  for(const p of Object.values(s.players)){releaseTractor(s,p);p.pos=[2.8,0,5];p.held=null;}
  log(s,'Rescue tow: cargo forfeited, +300 quota, one travel day.');break;
 }
 default:throw Error('Unknown action.');
 }
}
function canMove(s,p,next){
 if(s.phase!=='salvage')return next[0]>-4&&next[0]<4&&next[2]>-9.5&&next[2]<9.5&&next[1]>=0&&next[1]<3;
 const was=onShip(p),inside=onShip({pos:next});
 if(was!==inside){
  const side=next[0]>3.5&&next[2]>6&&next[2]<9&&next[1]<3;
  const rear=s.ship.hatchOpen&&Math.abs(next[0])<REAR_HATCH.width/2-.2&&Math.abs(p.pos[0])<REAR_HATCH.width/2-.2 &&
    next[1]<REAR_HATCH.height&&p.pos[1]<REAR_HATCH.height&&Math.min(p.pos[2],next[2])>9.5;
  if(!side&&!rear)return false;
 }
 return Math.abs(next[0])<60&&next[2]>-65&&next[2]<30&&next[1]>=0&&next[1]<20;
}
export function tick(s,dt){
 s.time+=dt;
 for(const [id,p] of Object.entries(s.players)){
  if(!p.connected){if(s.time-p.lastSeen>60)delete s.players[id];continue;}
  if(s.time-p.lastSeen>1)p.input={x:0,z:0,y:0};
  let {x,z,y}=p.input,mag=Math.hypot(x,z,y);if(mag>1){x/=mag;z/=mag;y/=mag;}
  const moving=mag>0;
  p.stamina??=100;
  if(p.sprintExhausted&&p.stamina>=25)p.sprintExhausted=false;
  const sprinting=moving&&p.input.sprint&&!p.sprintExhausted&&p.stamina>0;
  const sprintTime=sprinting?Math.min(dt,p.stamina/25):0;
  if(sprinting){p.stamina=Math.max(0,p.stamina-25*dt);if(p.stamina===0)p.sprintExhausted=true;}
  else p.stamina=Math.min(100,p.stamina+20*dt);
  const speed=(p.held?3.8:6)*(dt+sprintTime);
  const delta=[(Math.cos(p.yaw)*x-Math.sin(p.yaw)*z)*speed,y*speed,(-Math.sin(p.yaw)*x-Math.cos(p.yaw)*z)*speed];
  for(let i=0;i<3;i++){const next=[...p.pos];next[i]+=delta[i];if(canMove(s,p,next))p.pos=next;}
  if(onShip(p))p.pos[1]=Math.max(0,p.pos[1]-dt*8);
  if(p.held){const c=s.cargo.find(c=>c.id===p.held);if(c)c.pos=[p.pos[0]-Math.sin(p.yaw)*2,p.pos[1]+1,p.pos[2]-Math.cos(p.yaw)*2];}
  if(p.tractor){
   const t=p.tractor,c=s.cargo.find(c=>c.id===t.id);
   if(!c||c.state!=='tractored'||c.carrier!==p.id){p.tractor=null;continue;}
   t.distance+=clamp(t.targetDistance-t.distance,-5*dt,5*dt);
   const oldAngle=c.angle||0;
   t.angle=wrapAngle(t.angle+clamp(wrapAngle(t.targetAngle-t.angle),-4*dt,4*dt));c.angle=t.angle;
   if(!cargoMoveValid(s,c,c.pos,c.pos)){c.angle=oldAngle;t.angle=oldAngle;}
   const dir=[-Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch)];
   const wanted=[p.pos[0]+dir[0]*t.distance,p.pos[1]+1.6+dir[1]*t.distance-c.dims[1]/2,p.pos[2]+dir[2]*t.distance];
   const diff=wanted.map((n,i)=>n-c.pos[i]),len=Math.hypot(...diff),ratio=len?Math.min(1,TRACTOR_SPEED*dt/len):0;
   const next=c.pos.map((n,i)=>n+diff[i]*ratio);
   if(cargoMoveValid(s,c,c.pos,next))c.pos=next;
   else for(let axis=0;axis<3;axis++){const point=[...c.pos];point[axis]=next[axis];if(cargoMoveValid(s,c,c.pos,point))c.pos=point;}
  }
 }
 if(!s.players[s.captain]||!s.players[s.captain].connected)s.captain=Object.values(s.players).find(p=>p.connected)?.id||null;
 const w=s.activeWreck?s.wrecks[s.activeWreck]:null;
 if(w?.crunchAt&&s.time>=w.crunchAt){
  w.crunchAt=0;w.crunched=true;w.taken=true;w.grapple=false;w.enemies=[];
  for(const c of s.cargo)if(c.source===w.id&&c.state==='loose'&&!onShip({pos:c.pos}))c.state='destroyed';
  let scrapX=-8;
  for(const dims of scrapCrates(w.scrapVolume??16)){
   const c=makeCargo(s,'scrap',w.id,[scrapX+dims[0]/2,0,-30],w.legal);c.dims=dims;scrapX+=dims[0]+1;
  }
  log(s,'Crunch complete. Wreck contents destroyed; Scrap ready for collection.');
 }
 for(const c of s.cargo){
  if(c.state!=='loose'||!c.velocity)continue;
  const next=c.pos.map((n,i)=>n+c.velocity[i]*dt);
  if(cargoMoveValid(s,c,c.pos,next))c.pos=next;else c.velocity=null;
 }
 if(s.phase==='salvage'&&w&&!w.crunched){
  for(const e of w.enemies.filter(e=>e.hp>0)){
   const targets=Object.values(s.players).filter(p=>p.connected&&!onShip(p));
   targets.sort((a,b)=>distance(a.pos,e.pos)-distance(b.pos,e.pos));const p=targets[0];if(!p)continue;
   const d=distance(p.pos,e.pos),range=e.kind==='creature'?2:15;
   if(d>range&&d<40){e.pos[0]+=(p.pos[0]-e.pos[0])/d*dt*2;e.pos[2]+=(p.pos[2]-e.pos[2])/d*dt*2;}
   if(d<range&&s.time>=e.nextAttack){
    p.hp-=e.kind==='creature'?20:12;e.nextAttack=s.time+2;
    if(p.hp<=0){
     p.stamina=100;p.sprintExhausted=false;
     if(p.held){const c=s.cargo.find(c=>c.id===p.held);if(c){c.state='loose';c.carrier=null;c.pos=[...p.pos];}p.held=null;}
     releaseTractor(s,p);
     p.pos=[2.8,0,6];p.hp=100;log(s,p.name+' recovered in the ship medbay; carried cargo left behind.');
    }
   }
  }
 }
 const e=s.encounter;
 if(e){
  if(e.type==='police'&&e.stage==='warning'&&s.time>=e.until){e.stage='scanning';e.until=s.time+5;log(s,'Police scan in progress.');}
  else if(e.type==='police'&&e.stage==='scanning'&&s.time>=e.until){
   e.caught=policeScan(s);e.fine=illegalValue(s,e.caught);
   if(e.fine){e.stage='fine';e.until=null;e.resolved=false;log(s,'Illegal cargo detected. Fine: '+e.fine+'. Pay, surrender detected cargo, or fight.');}
   else{clearEncounter(s);log(s,'Police scan clear.');}
  }else if(e.stage==='fight'&&s.time>=e.until){
   e.stage='reinforcements';e.until=s.time+8;log(s,'Distress signal sent. Police reinforcements incoming.');
  }else if(e.stage==='reinforcements'&&s.time>=e.until)destroyShip(s);
  else if(e.type==='raider'&&s.time>=e.until){clearEncounter(s);log(s,'Raider broke pursuit.');}
  // Re-read encounter after possible destroyShip / clear.
  const live=s.encounter;
  if(live&&(live.stage==='fight'||live.type==='raider')&&s.time>=live.nextShot){
   s.ship.hull-=Math.max(6,18-s.ship.upgrades.armor*3);live.lastShotAt=s.time;live.nextShot=s.time+4;
   if(s.ship.hull<=0)destroyShip(s);
  }
 }
 if(s.combatVfx&&s.time-s.combatVfx.at>1.5)s.combatVfx=null;
 if(s.transit&&!s.encounter&&s.time>=s.transit.arrival){
  const target=s.transit.target;s.transit=null;s.location=target;
  if(['A','B'].includes(target)){s.phase='docked';s.activeWreck=null;log(s,'Docked at Market '+target+'. Sell before settling any due quota.');}
  else{const lead=s.leads.find(l=>l.id===target);if(lead){spawnWreck(s,lead);lead.visited=true;s.activeWreck=target;s.phase='salvage';log(s,'Wreck reached. Use scanner console to grapple and identify.');}}
  if(s.quota.days>=s.quota.limit)markQuotaDue(s,'QUOTA DUE. Return to a market to sell within '+QUOTA_SETTLEMENT_GRACE+'s; payment will be collected automatically.');
 }
 // Collect payment before grace expiry so a solvent crew is never repossessed
 // on the same tick they become able to pay. Idempotent across ticks.
 autoSettleQuota(s);
 // Settlement grace ticks only while no encounter is active (fair return trip /
 // mandatory police stop). Market hops and reconnects do not reset remaining time.
 if(s.quota.due){
  if(s.quota.settleRemaining==null)s.quota.settleRemaining=QUOTA_SETTLEMENT_GRACE;
  if(!s.encounter){
   s.quota.settleRemaining-=dt;
   if(s.quota.settleRemaining<=0){
    resetRun(s,'SETTLEMENT WINDOW EXPIRED. REPOSSESSED. Fresh starter ship; shared account reset to 1,000 credits.');
   }
  }
 }
}
export function snapshot(s){
 const w=s.activeWreck?s.wrecks[s.activeWreck]:null;
 const cargo=s.cargo.filter(c=>!['sold','lost','destroyed'].includes(c.state)&&
  (c.state==='secured'||c.state==='held'||c.state==='tractored'||onShip({pos:c.pos})||c.source===s.activeWreck||c.source==='rival-'+s.activeWreck));
 return {version:VERSION,code:s.code,time:s.time,run:s.run,captain:s.captain,credits:s.credits,ship:s.ship,location:s.location,phase:s.phase,
 quota:s.quota,leads:s.leads.map(({goods,model,...l})=>l),players:Object.values(s.players).map(({input,...p})=>p),
 cargo,wreck:w?{...w,model:undefined,visual:{color:MODELS[w.model].color,thrusters:w.model===1?4:2},owner:Object.keys(w.clues).length>=3?w.owner:'Unidentified'}:null,
 transit:s.transit,encounter:s.encounter,combatVfx:s.combatVfx,marketDay:s.marketDay,log:s.log,
 prices:Object.fromEntries(['A','B'].map(m=>[m,Object.fromEntries(Object.keys(GOODS).map(k=>[k,marketPrice(s,k,m)]))]))};
}
