import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,act,tick,STATIONS,settleQuota,holdDimensions,policeScan,detectionChance,fits,destroyShip} from '../shared/game.js';
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
 assert.ok(s.cargo.filter(c=>c.type!=='scrap').every(c=>c.state==='destroyed'));assert.equal(s.cargo.filter(c=>c.type==='scrap').length,4);
});
test('NPC ship loss retains cash less outstanding fine, distinct from repossession',()=>{
 const s=game();s.credits=5000;s.ship.upgrades.weapon=1;s.encounter={fine:900};destroyShip(s);assert.equal(s.credits,4100);assert.equal(s.ship.upgrades.weapon,0);
});
test('crew authority and shared purchase prevent duplicate charges',()=>{
 const s=game();addPlayer(s,'q','Crew');at(s,'board');act(s,'p',{type:'accept',id:'paid-a'});assert.equal(s.credits,0);assert.throws(()=>act(s,'p',{type:'accept',id:'paid-a'}));assert.equal(s.credits,0);
 s.players.q.pos=[...STATIONS.nav];assert.throws(()=>act(s,'q',{type:'travel',id:'paid-a'}),/captain/);
});
