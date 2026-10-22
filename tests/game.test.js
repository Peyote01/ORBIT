import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,act,tick,STATIONS,settleQuota,holdDimensions,policeScan,detectionChance,fits,destroyShip,setInput,scrapCrates,volume,cargoValue,cargoPrice} from '../shared/game.js';
function game(){const s=createGame('TEST',()=>.99);addPlayer(s,'p','Captain');return s;}
function at(s,key){s.players.p.pos=[...STATIONS[key]];}
function advance(s,n){for(let i=0;i<n*20;i++)tick(s,.05);}
test('free contract, travel, recovery, packing, sale and first day',()=>{
 const s=game();at(s,'board');act(s,'p',{type:'accept',id:'free-a'});at(s,'nav');act(s,'p',{type:'travel',id:'free-a'});advance(s,9);
 assert.equal(s.quota.days,0);assert.equal(s.phase,'salvage');at(s,'scanner');act(s,'p',{type:'grapple'});
 const c=s.cargo[0];s.players.p.pos=[...c.pos];act(s,'p',{type:'pickup',id:c.id});
 at(s,'cargo');act(s,'p',{type:'secure',container:'bay0'});assert.equal(c.state,'secured');
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
 const crate=s.cargo[0];s.players.p.pos=[...crate.pos];act(s,'p',{type:'pickup',id:crate.id});
 assert.equal(crate.carrier,'p');
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
