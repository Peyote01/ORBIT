import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,leavePlayer,act,tick,STATIONS,settleQuota,holdDimensions,policeScan,detectionChance,fits,destroyShip,setInput,scrapCrates,volume,cargoValue,cargoPrice,marketPrice,tractorSlot,cargoMoveValid,REAR_HATCH,onShip,snapshot,makeShip,rearHatchHeight} from '../shared/game.js';
function game(){const s=createGame('TEST',()=>.99);addPlayer(s,'p','Captain');return s;}
function at(s,key){s.players.p.pos=[...STATIONS[key]];}
function advance(s,n){for(let i=0;i<n*20;i++)tick(s,.05);}
test('free contract, travel, recovery, packing, sale and first day',()=>{
 const s=game();at(s,'board');act(s,'p',{type:'accept',id:'free-a'});at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 assert.equal(s.quota.days,0);assert.equal(s.phase,'salvage');at(s,'scanner');act(s,'p',{type:'grapple'});
 const c=s.cargo[0],p=s.players.p;
 p.pos=[c.pos[0],0,c.pos[2]+3];p.pitch=-.35;
 act(s,'p',{type:'tractorAttach',id:c.id});
 p.pos=[-1.5,0,3];c.pos=[-1.5,0,1.5];c.angle=0;
 assert.equal(tractorSlot(s,c)?.valid,true);
 act(s,'p',{type:'tractorSecure'});assert.equal(c.state,'secured');
 at(s,'nav');act(s,'p',{type:'travel',id:'A'});advance(s,9);assert.equal(s.quota.days,1);
 at(s,'market');act(s,'p',{type:'sell',ids:[c.id]});assert.ok(s.credits>1000);
});
test('extension adds seven days to same quota once; failure resets everything',()=>{
 const s=game();s.quota.days=7;s.quota.due=true;settleQuota(s,true);
 assert.equal(s.quota.limit,14);assert.equal(s.quota.amount,1500);assert.equal(s.ship.extensionAvailable,false);
 s.quota.days=14;s.quota.due=true;assert.throws(()=>settleQuota(s,true));
 s.credits=1499;settleQuota(s);assert.equal(s.credits,1000);assert.equal(s.quota.days,0);assert.equal(s.ship.extensionAvailable,true);
});
test('payment deducts shared cash and starts next quota',()=>{
 const s=game();s.credits=2000;s.quota.due=true;settleQuota(s);assert.equal(s.credits,500);assert.equal(s.quota.number,2);assert.ok(s.quota.freeDeparture);
});
test('shield halves volume once and applies only to its contents',()=>{
 const s=game();const b=s.ship.containers[0];b.shield=4;assert.deepEqual(holdDimensions(b),[2,2,4]);assert.equal(detectionChance(4),.0625);
 s.cargo=[{id:'hidden',type:'illicit',illegal:true,state:'secured',container:'bay0'},{id:'open',type:'illicit',illegal:true,state:'secured',container:'bay1'}];
 assert.deepEqual(policeScan(s),['open']);b.shield=1;assert.deepEqual(holdDimensions(b),[2,2,4]);
});
test('packing checks bounds, overlap and support',()=>{
 const s=game(),c={id:'x',dims:[2,1,2]};
 assert.ok(fits(s,c,'bay0',[0,0,0]));assert.equal(fits(s,c,'bay0',[1,0,0]),false);assert.equal(fits(s,c,'bay0',[0,1,0]),false);
 s.cargo=[{...c,state:'secured',container:'bay0',cell:[0,0,0],packedDims:[2,1,2]}];
 assert.equal(fits(s,{id:'y',dims:c.dims},'bay0',[0,0,0]),false);assert.ok(fits(s,{id:'y',dims:c.dims},'bay0',[0,1,0]));
 assert.equal(fits(s,{id:'huge',dims:[4,4,8]},'bay0',[0,0,0]),false);
});
test('Crunch destroys remaining contents and produces only Scrap',()=>{
 const s=game();at(s,'board');act(s,'p',{type:'accept',id:'free-a'});at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 at(s,'scanner');act(s,'p',{type:'grapple'});act(s,'p',{type:'crunch'});advance(s,4);
 assert.ok(s.cargo.filter(c=>c.type!=='scrap').every(c=>c.state==='destroyed'));assert.equal(s.cargo.filter(c=>c.type==='scrap').length,1);
});
test('NPC ship loss retains cash less outstanding fine, distinct from repossession',()=>{
 const s=game();s.credits=5000;s.ship.upgrades.weapon=1;s.encounter={fine:900};destroyShip(s);assert.equal(s.credits,4100);assert.equal(s.ship.upgrades.weapon,0);
});
test('crew authority and shared purchase prevent duplicate charges',()=>{
 const s=game();addPlayer(s,'q','Crew');at(s,'board');act(s,'p',{type:'accept',id:'paid-a'});assert.equal(s.credits,0);assert.throws(()=>act(s,'p',{type:'accept',id:'paid-a'}));assert.equal(s.credits,0);
 s.players.q.pos=[...STATIONS.nav];assert.throws(()=>act(s,'q',{type:'travel',id:'paid-a'}),/captain/);
});

test('contracts can be accepted during EVA; salvage needs neither scans nor grapple',()=>{
 const s=game();s.players.p.pos=[30,0,-20];act(s,'p',{type:'accept',id:'free-a'});
 at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 const w=s.wrecks[s.activeWreck];assert.equal(w.grapple,false);assert.equal(Object.keys(w.clues).length,0);
 const crate=s.cargo[0],p=s.players.p;p.pos=[crate.pos[0],0,crate.pos[2]+3];p.pitch=-.35;
 act(s,'p',{type:'tractorAttach',id:crate.id});
 assert.equal(crate.carrier,'p');assert.equal(crate.state,'tractored');
 act(s,'p',{type:'accept',id:'free-b'});assert.ok(s.leads.find(l=>l.id==='free-b').accepted);
});
test('sprint doubles speed, consumes stamina, exhausts and recovers',()=>{
 const s=game(),p=s.players.p;p.pos=[0,0,0];
 setInput(s,'p',{z:1,sprint:false});tick(s,.05);const normal=-p.pos[2];
 p.pos=[0,0,0];setInput(s,'p',{z:1,sprint:true});tick(s,.05);
 assert.equal(-p.pos[2],normal*2);assert.equal(p.stamina,98.75);
 for(let i=0;i<79;i++){p.pos=[0,0,0];setInput(s,'p',{z:1,sprint:true});tick(s,.05);}
 assert.equal(p.stamina,0);assert.equal(p.sprintExhausted,true);
 p.pos=[0,0,0];setInput(s,'p',{z:1,sprint:true});tick(s,.05);assert.equal(-p.pos[2],normal);
 for(let i=0;i<100;i++){setInput(s,'p',{z:0});tick(s,.05);}
 assert.equal(p.stamina,100);assert.equal(p.sprintExhausted,false);
});
test('Scrap packing is largest-first with exact volume and proportional value',()=>{
 const dims=scrapCrates(175);
 assert.deepEqual(dims.map(volume),[128,32,8,4,2,1]);
 assert.deepEqual(dims[0],[4,4,8]);assert.equal(dims.reduce((n,d)=>n+volume(d),0),175);
 const s=game(),large={type:'scrap',dims:[2,2,4]},small={type:'scrap',dims:[2,1,2]};
 assert.equal(cargoValue(large),cargoValue(small)*4);assert.equal(cargoPrice(s,large),cargoPrice(s,small)*4);
 assert.deepEqual(scrapCrates(0),[]);assert.throws(()=>scrapCrates(-1));
});
test('scan accepts the facing component while rotating without a release step',()=>{
 const s=game();act(s,'p',{type:'accept',id:'free-a'});at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);at(s,'scanner');act(s,'p',{type:'grapple'});
 for(let i=0;i<8;i++)act(s,'p',{type:'rotate',delta:.15,rotationId:i});
 act(s,'p',{type:'scan'});assert.equal(Object.keys(s.wrecks[s.activeWreck].clues).length,1);
 assert.equal(s.wrecks[s.activeWreck].rotationAcks.p,7);
});

test('handheld tractor is exclusive, range-checked and releases cargo on disconnect',()=>{
 const s=game();addPlayer(s,'q','Wingmate');
 act(s,'p',{type:'accept',id:'free-a'});at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 const c=s.cargo[0],p=s.players.p;
 p.pos=[c.pos[0],0,c.pos[2]+3];p.yaw=0;p.pitch=-.35;
 act(s,'p',{type:'tractorAttach',id:c.id});
 assert.equal(c.state,'tractored');assert.equal(c.carrier,'p');
 s.players.q.pos=[...p.pos];s.players.q.pitch=-.35;
 assert.throws(()=>act(s,'q',{type:'tractorAttach',id:c.id}),/not available/);
 setInput(s,'p',{tractorDistance:6,tractorAngle:Math.PI/2,pitch:-.1,yaw:0});
 advance(s,1);
 assert.ok(Math.abs(p.tractor.distance-6)<.1);
 assert.ok(Math.abs(c.angle-Math.PI/2)<.1);
 assert.equal(c.state,'tractored');
 act(s,'p',{type:'tractorRelease'});
 assert.equal(c.state,'loose');assert.equal(c.carrier,null);assert.equal(p.tractor,null);
 p.pos=[40,0,0];assert.throws(()=>act(s,'p',{type:'tractorAttach',id:c.id}),/outside tractor range|Aim directly|Crate outside|not available/);
});
test('tractor can snap crates to grid; blocked and rotated placement is rejected',()=>{
 const s=game();act(s,'p',{type:'accept',id:'free-a'});at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 const c=s.cargo[0],p=s.players.p;p.pos=[...c.pos];p.pos[2]+=3;p.pitch=-.35;
 act(s,'p',{type:'tractorAttach',id:c.id});
 p.pos=[1.5,0,3];c.pos=[1.5,0,1.5];c.angle=.8;
 assert.equal(tractorSlot(s,c).valid,false);
 assert.throws(()=>act(s,'p',{type:'tractorSecure'}),/green floor\/grid slot/);
 c.angle=0;assert.equal(tractorSlot(s,c).valid,true);
 act(s,'p',{type:'tractorSecure'});
 assert.equal(c.state,'secured');assert.equal(c.container,'bay1');assert.equal(p.tractor,null);
});

test('disconnect automatically releases a tractor and preserves the loose crate',()=>{
 const s=game();act(s,'p',{type:'accept',id:'free-a'});at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 const c=s.cargo[0],p=s.players.p;p.pos=[c.pos[0],0,c.pos[2]+3];p.pitch=-.35;
 act(s,'p',{type:'tractorAttach',id:c.id});
 leavePlayer(s,'p');
 assert.equal(c.state,'loose');assert.equal(c.carrier,null);assert.equal(p.tractor,null);
});

test('rear hatch is synchronized, can be operated from inside or outside, and locks before travel',()=>{
 const s=game();act(s,'p',{type:'accept',id:'free-a'});
 at(s,'hatch');
 assert.equal(s.ship.hatchOpen,false);
 act(s,'p',{type:'cargoHatch'});
 assert.equal(s.ship.hatchOpen,true);
 assert.equal(snapshot(s).ship.hatchOpen,true);
 at(s,'nav');
 assert.throws(()=>act(s,'p',{type:'travel',id:'free-a'}),/Close the rear cargo hatch/);
 s.players.p.pos=[0,0,12.5];
 act(s,'p',{type:'cargoHatch'});
 assert.equal(s.ship.hatchOpen,false);
 at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});
 assert.equal(s.phase,'transit');
 assert.throws(()=>act(s,'p',{type:'cargoHatch'}),/transit/);
});
test('open rear hatch lets players walk through aft bulkhead; closed hatch stops them',()=>{
 const s=game();s.phase='salvage';
 const p=s.players.p;p.pos=[0,0,9.5];
 setInput(s,'p',{z:-1,yaw:0});
 for(let i=0;i<12;i++)tick(s,.05);
 assert.equal(onShip(p),true);
 assert.ok(p.pos[2]<REAR_HATCH.z);
 p.pos=[0,0,9.5];
 act(s,'p',{type:'cargoHatch'});
 for(let i=0;i<12;i++)tick(s,.05);
 assert.equal(onShip(p),false);
 assert.ok(p.pos[2]>REAR_HATCH.z);
 // Entry from exterior uses the same portal.
 setInput(s,'p',{z:1,yaw:0});
 for(let i=0;i<12;i++)tick(s,.05);
 assert.equal(onShip(p),true);
});
test('large crates can pass through the open rear hatch but not the closed rear wall',()=>{
 const make=()=>{
  const s=game();at(s,'board');act(s,'p',{type:'accept',id:'free-b'});at(s,'nav');act(s,'p',{type:'travel',id:'free-b'});advance(s,9);
  const p=s.players.p,c=s.cargo[0];
  // A 3x2x3 crate is wider than the narrow side airlock.
  c.dims=[3,2,3];c.pos=[0,0,13.5];
  p.pos=[0,0,9.3];p.yaw=Math.PI;p.pitch=-.14;
  act(s,'p',{type:'tractorAttach',id:c.id});
  return {s,p,c};
 };
 const closed=make();
 setInput(closed.s,'p',{z:-1,yaw:Math.PI,pitch:-.14});
 for(let i=0;i<27;i++)tick(closed.s,.05);
 assert.ok(closed.c.pos[2]>REAR_HATCH.z,'Closed hatch must keep crate outside');
 const opened=make();
 act(opened.s,'p',{type:'cargoHatch'});
 setInput(opened.s,'p',{z:-1,yaw:Math.PI,pitch:-.14});
 for(let i=0;i<27;i++)tick(opened.s,.05);
 assert.ok(opened.c.pos[2]<REAR_HATCH.z-1,'Open hatch must admit wide crate');
});
test('hatch cannot close through a crate or another crew member',()=>{
 const s=game();s.phase='salvage';at(s,'hatch');act(s,'p',{type:'cargoHatch'});
 s.cargo.push({id:'obstruction',type:'machinery',dims:[2,1,2],pos:[0,0,REAR_HATCH.z],state:'loose',angle:0});
 assert.throws(()=>act(s,'p',{type:'cargoHatch'}),/crate is obstructing/);
 s.cargo[0].pos=[0,0,4];
 s.players.p.pos=[0,0,REAR_HATCH.z];
 assert.throws(()=>act(s,'p',{type:'cargoHatch'}),/crew member/);
 s.players.p.pos=[0,0,8.7];
 act(s,'p',{type:'cargoHatch'});
 assert.equal(s.ship.hatchOpen,false);
});

test('upgraded ship hatch admits full-size reactor crate and grid can secure it',()=>{
 const s=game();at(s,'board');act(s,'p',{type:'accept',id:'free-a'});
 at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 const upgraded=makeShip(2);s.ship.upgrades.hull=2;s.ship.containers=upgraded.containers;
 assert.equal(rearHatchHeight(s),4.2);
 const p=s.players.p,c=s.cargo[0];c.dims=[4,4,8];c.pos=[0,0,16];
 p.pos=[0,0,9.2];p.yaw=Math.PI;p.pitch=.06;
 act(s,'p',{type:'tractorAttach',id:c.id});
 act(s,'p',{type:'cargoHatch'});
 for(let i=0;i<40;i++){setInput(s,'p',{z:-1,yaw:Math.PI,pitch:.06});tick(s,.05);}
 assert.ok(c.pos[2]<REAR_HATCH.z-4,'Reactor must fully clear upgraded aft doorway: z='+c.pos[2]+' pilot='+p.pos[2]+' distance='+p.tractor?.distance);
 p.pos=[-2,0,5];c.pos=[-2,0,4];c.angle=0;
 const slot=tractorSlot(s,c);assert.equal(slot?.valid,true);
 act(s,'p',{type:'tractorSecure'});
 assert.equal(c.state,'secured');assert.equal(c.container,'bay0');
});

test('wide freight clears ENTIRE rear hatch, including the trailing edge',()=>{
 const s=game(),c={id:'test-large',type:'machinery',dims:[3,2,4],angle:0,state:'loose',pos:[0,0,14]};
 s.ship.hatchOpen=true;
 // 4 m deep crate: previously the front entered but center stalled near z=8.15.
 for(let z=14;z>6.5;z-=.1)
  assert.equal(cargoMoveValid(s,c,[0,0,z],[0,0,z-.1]),true,'Crate stuck at z='+z.toFixed(2));
 s.ship.hatchOpen=false;
 assert.equal(cargoMoveValid(s,c,[0,0,11.9],[0,0,11.7]),false,'Closed aft door blocks a crossing');
 s.ship.hatchOpen=true;
 assert.equal(cargoMoveValid(s,c,[4,0,10.4],[4,0,10.2]),false,'Full crate must fit frame width');
 assert.equal(cargoMoveValid(s,c,[0,0,-10.1],[0,0,-10.6]),false,'Open aft hatch must never let cargo exit through sealed bow');
 s.ship.hatchOpen=false;
 assert.equal(cargoMoveValid(s,c,[0,0,6],[0,0,5.9]),true,'Already-loaded cargo can move within the hold');
});
test('magnetic floor snap accepts a hovering, slightly rotated crate with a single E',()=>{
 const s=game(),p=s.players.p;
 s.phase='salvage';p.pos=[1,0,5];
 const c={id:'hover',type:'machinery',dims:[2,1,2],pos:[1.15,1.35,5.1],state:'tractored',carrier:'p',angle:.4};
 s.cargo.push(c);p.tractor={id:c.id};
 const slot=tractorSlot(s,c);
 assert.equal(slot?.valid,true,'Floor magnetic field finds a supported nearby grid slot');
 assert.equal(slot.cell[1],0,'Floor should beat unsupported midair placement');
 act(s,'p',{type:'tractorSecure'});
 assert.equal(c.state,'secured');assert.equal(c.cell[1],0);assert.equal(p.tractor,null);
 assert.equal(c.container,'bay1');
});
test('floor snapping requires crate completely inside and never overlaps occupied cargo',()=>{
 const s=game(),p=s.players.p;
 s.phase='salvage';p.pos=[1,0,5];
 const c={id:'external',type:'machinery',dims:[2,1,2],pos:[1,1.1,10.0],state:'tractored',carrier:'p',angle:0};
 s.cargo.push(c);p.tractor={id:c.id};
 assert.equal(tractorSlot(s,c),null,'Crate straddling aft plane must enter before snapping');
 assert.throws(()=>act(s,'p',{type:'tractorSecure'}),/entire crate inside/);
 c.pos=[1,1.35,5.2];
 assert.equal(tractorSlot(s,c)?.valid,true);
 s.cargo.push({id:'occupied',type:'machinery',dims:[2,1,2],state:'secured',container:'bay1',cell:[0,0,2],packedDims:[2,1,2],pos:[1,0,3]});
 const stacked=tractorSlot(s,c);
 assert.equal(stacked?.valid,true,'Magnetic placement finds a supported position above occupied floor');
 assert.equal(stacked?.cell[1],1,'Stack above the existing crate rather than overlapping it');
});

test('hand-carry pickup, inventory secure and manual drop actions are disabled',()=>{
 const s=game();at(s,'board');act(s,'p',{type:'accept',id:'free-a'});
 at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 const c=s.cargo[0];s.players.p.pos=[...c.pos];
 for(const type of ['pickup','drop','secure']){
  assert.throws(()=>act(s,'p',{type,id:c.id,container:'bay0'}),/Unknown action/);
 }
 assert.equal(c.state,'loose');assert.equal(s.players.p.held,null);
});
test('32 cubic meter scrap fits exactly in empty starter bay after automatic 90-degree tip',()=>{
 const s=game();s.phase='salvage';const p=s.players.p;
 const c={id:'large-scrap',type:'scrap',dims:[4,2,4],pos:[1,.65,2],angle:0,state:'tractored',carrier:'p',illegal:false};
 s.cargo.push(c);p.pos=[1,0,5];p.tractor={id:c.id,angle:0};
 const slot=tractorSlot(s,c);
 assert.equal(volume(c.dims),32);
 assert.equal(volume(s.ship.containers[1].dims),32);
 assert.equal(slot?.valid,true,'A 4x2x4 crate should tip into a 2x4x4 bay');
 assert.equal(slot?.container,'bay1');
 assert.deepEqual(slot?.dims,[2,4,4]);
 assert.equal(slot?.autoRotate,true);
 act(s,'p',{type:'tractorSecure'});
 assert.equal(c.state,'secured');assert.equal(c.container,'bay1');assert.deepEqual(c.packedDims,[2,4,4]);
 assert.equal(cargoPrice(s,c,'A'),Math.floor(marketPrice(s,'scrap','A')*8));
});
test('auto-orientation respects shielded capacity and occupied cargo',()=>{
 const s=game();s.phase='salvage';const p=s.players.p;
 s.ship.containers[0].shield=1;
 const c={id:'large-scrap',type:'scrap',dims:[4,2,4],pos:[1,0,2],angle:0,state:'tractored',carrier:'p',illegal:false};
 s.cargo.push(c);p.pos=[1,0,5];p.tractor={id:c.id};
 assert.equal(tractorSlot(s,c)?.container,'bay1','A half-capacity shielded bay must be ignored');
 s.cargo.push({id:'block',type:'alloy',dims:[1,1,1],pos:[1,0,0],state:'secured',container:'bay1',cell:[0,0,0],packedDims:[1,1,1]});
 assert.equal(tractorSlot(s,c),null,'One occupied cubic meter prevents a full 32 m³ crate');
 assert.throws(()=>act(s,'p',{type:'tractorSecure'}),/green floor\/grid slot/);
});
test('quota due permits returning to either market to sell, but blocks new wrecks',()=>{
 for(const market of ['A','B']){
  const s=game();at(s,'board');act(s,'p',{type:'accept',id:'free-a'});
  at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
  const c=s.cargo[0];c.state='secured';c.container='bay1';c.cell=[0,0,0];c.packedDims=[...c.dims];
  s.quota.days=7;s.quota.due=true;
  assert.throws(()=>act(s,'p',{type:'travel',id:'free-b'}),/Quota due/);
  at(s,'nav');act(s,'p',{type:'travel',id:market});advance(s,9);
  assert.equal(s.location,market);assert.equal(s.phase,'docked');assert.equal(s.quota.due,true);
  at(s,'market');act(s,'p',{type:'sell',ids:[c.id]});assert.equal(c.state,'sold');
 }
 const s=game();s.quota.due=true;at(s,'nav');
 act(s,'p',{type:'travel',id:'B'});advance(s,9);
 assert.equal(s.location,'B','Crew can switch markets while payment is due');
 assert.equal(s.quota.due,true);
});

test('loose cargo inside the ship blocks departure until secured, but dockside tractor can recover old stranded crates',()=>{
 const s=game(),p=s.players.p;
 at(s,'board');act(s,'p',{type:'accept',id:'free-a'});
 const c={id:'orphan',type:'machinery',dims:[2,1,2],state:'loose',carrier:null,container:null,pos:[1,0,2],angle:0};
 s.cargo.push(c);
 at(s,'nav');
 assert.throws(()=>act(s,'p',{type:'travel',id:'free-a'}),/Unsecured cargo aboard/);
 assert.equal(s.phase,'docked');assert.equal(s.ship.fuel,100,'Failed travel must not consume fuel');
 p.pos=[1,0,5];p.pitch=-.35;
 act(s,'p',{type:'tractorAttach',id:c.id});
 assert.equal(c.state,'tractored');assert.equal(c.carrier,'p');
 assert.equal(tractorSlot(s,c)?.valid,true);
 act(s,'p',{type:'tractorSecure'});
 assert.equal(c.state,'secured');assert.equal(p.tractor,null);
 at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});
 assert.equal(s.phase,'transit');
});
test('crew can discard a stranded loose crate from the cargo console without carrying it',()=>{
 const s=game(),p=s.players.p;
 const c={id:'stranded',type:'alloy',dims:[1,1,1],state:'loose',pos:[1,0,4],angle:0};
 s.cargo.push(c);at(s,'cargo');act(s,'p',{type:'jettison',id:c.id});
 assert.equal(c.state,'lost');assert.ok(!snapshot(s).cargo.some(x=>x.id===c.id));
 assert.throws(()=>act(s,'p',{type:'tractorAttach',id:c.id}),/not available/);
});
test('dropping a tractor crate aboard prevents launch until recovered, exterior loose salvage does not',()=>{
 const s=game(),p=s.players.p;at(s,'board');act(s,'p',{type:'accept',id:'free-a'});
 at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 const c=s.cargo[0];c.pos=[1,0,2];p.pos=[1,0,5];p.pitch=-.35;
 act(s,'p',{type:'tractorAttach',id:c.id});act(s,'p',{type:'tractorRelease'});
 assert.equal(c.state,'loose');at(s,'nav');
 assert.throws(()=>act(s,'p',{type:'travel',id:'A'}),/Unsecured cargo aboard/);
 c.pos=[0,0,-30];assert.doesNotThrow(()=>act(s,'p',{type:'travel',id:'A'}));
});
test('day 7 quota is charged automatically when solvent crew reaches market without day 8',()=>{
 const s=game();at(s,'board');act(s,'p',{type:'accept',id:'free-a'});
 at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 s.quota.days=6;s.credits=2400;s.wrecks['free-a'].taken=true;
 at(s,'nav');act(s,'p',{type:'travel',id:'A'});
 assert.equal(s.quota.days,7);assert.equal(s.quota.due,true);
 advance(s,9);
 assert.equal(s.location,'A');assert.equal(s.quota.number,2);
 assert.equal(s.quota.days,0);assert.equal(s.quota.due,false);
 assert.equal(s.credits,900,'Exactly one 1500 credit payment is deducted');
 advance(s,2);assert.equal(s.credits,900,'Server ticks must not charge twice');
 assert.ok(s.log.some(x=>x.text.includes('AUTOMATIC QUOTA PAYMENT')));
});
test('market sale covers an underfunded due quota automatically, allowing sale before repossession',()=>{
 const s=game(),p=s.players.p;
 s.quota.days=7;s.quota.due=true;s.credits=1450;s.location='A';s.phase='docked';
 const c={id:'final-sale',type:'alloy',dims:[1,1,1],state:'secured',container:'bay1',cell:[0,0,0],packedDims:[1,1,1]};
 s.cargo.push(c);
 tick(s,.05);assert.equal(s.quota.number,1,'Do not repossess a crew that still needs to sell cargo');
 at(s,'market');act(s,'p',{type:'sell',ids:[c.id]});
 assert.equal(c.state,'sold');assert.equal(s.quota.number,2);
 assert.equal(s.quota.due,false);
 assert.ok(s.credits>=0&&s.credits<300,'Payment must be deducted from the shared balance');
});
test('overdue crew can change markets without clock exceeding limit, tow also clamps clock',()=>{
 const s=game();s.quota.days=7;s.quota.due=true;s.credits=1000;
 at(s,'nav');act(s,'p',{type:'travel',id:'B'});advance(s,9);
 assert.equal(s.quota.days,7);assert.equal(s.quota.due,true);
 assert.equal(s.location,'B');
 at(s,'nav');act(s,'p',{type:'travel',id:'A'});advance(s,9);
 assert.equal(s.quota.days,7);assert.equal(s.quota.due,true);
 at(s,'nav');act(s,'p',{type:'tow'});
 assert.equal(s.quota.days,7);assert.equal(s.quota.due,true);
});

test('police encounter broadcasts its visible ship and scan stage to every crew member',()=>{
 const s=createGame('POLICE',()=>.2);addPlayer(s,'p','Captain');addPlayer(s,'q','Crew');
 at(s,'board');act(s,'p',{type:'accept',id:'free-a'});
 at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 s.wrecks['free-a'].taken=true;s.players.q.pos=[2,0,5];
 at(s,'nav');act(s,'p',{type:'travel',id:'A'});
 assert.equal(s.encounter?.type,'police');
 assert.equal(s.encounter?.stage,'warning');
 assert.equal(s.encounter?.startedAt,s.time);
 assert.equal(snapshot(s).encounter?.type,'police');
 advance(s,21);assert.equal(s.encounter?.stage,'scanning');
 assert.equal(snapshot(s).encounter?.stage,'scanning');
 advance(s,6);
 assert.equal(s.encounter,null,'Clear police inspection removes the visual ship');
 assert.equal(snapshot(s).encounter,null);
});
test('raider fire timestamps match actual hull damage and player cannon shots',()=>{
 const s=game();s.phase='transit';s.ship.upgrades.weapon=1;s.ship.hull=100;
 s.encounter={type:'raider',stage:'attack',hp:80,until:s.time+25,nextShot:s.time+1,startedAt:s.time,lastShotAt:null,lastPlayerShotAt:null};
 const prior=s.ship.hull;advance(s,1.1);
 assert.ok(s.ship.hull<prior);
 assert.ok(Number.isFinite(snapshot(s).encounter?.lastShotAt));
 const hp=s.encounter.hp;
 at(s,'nav');act(s,'p',{type:'shipfire'});
 assert.equal(s.encounter.hp,hp-12);
 assert.equal(snapshot(s).encounter.lastPlayerShotAt,s.time);
 // Eliminating an encounter leaves a short shared destruction flash.
 s.encounter.hp=12;
 advance(s,1);
 at(s,'nav');act(s,'p',{type:'shipfire'});
 assert.equal(s.encounter,null);
 assert.equal(snapshot(s).combatVfx?.kind,'destroyed');
 assert.equal(snapshot(s).combatVfx?.type,'raider');
 advance(s,1.6);
 assert.equal(snapshot(s).combatVfx,null,'Expired explosions are removed from game state');
});
test('police and raider ship visual events are removed on paid citation, escape and ship destruction',()=>{
 const s=game();s.encounter={type:'police',stage:'fine',fine:100,hp:100};
 s.credits=1000;act(s,'p',{type:'payfine'});assert.equal(snapshot(s).encounter,null);
 s.encounter={type:'raider',stage:'attack',hp:80,until:s.time+20};
 at(s,'nav');act(s,'p',{type:'boost'});
 assert.equal(snapshot(s).encounter,null);assert.equal(s.ship.fuel,90);
 s.encounter={type:'raider',stage:'attack',hp:80,fine:0};
 s.combatVfx={type:'raider',kind:'destroyed',at:s.time};
 destroyShip(s);assert.equal(snapshot(s).encounter,null);assert.equal(snapshot(s).combatVfx,null);
});
