import {test,expect} from '@playwright/test';
test('two browser contexts join the same 3D game',async({browser})=>{
 const one=await browser.newContext(),two=await browser.newContext();const a=await one.newPage(),b=await two.newPage();const errors=[];a.on('pageerror',e=>errors.push(e.message));b.on('pageerror',e=>errors.push(e.message));
 await a.goto('/');await a.getByRole('button',{name:'START A CREW'}).click();await expect(a.locator('#hud')).toBeVisible();
 const hud=await a.locator('#hud').innerText();const code=hud.match(/ORBIT \/ ([A-F0-9]{6})/)[1];
 await b.goto('/');await b.getByLabel('Room code').fill(code);await b.getByRole('button',{name:'JOIN',exact:true}).click();
 await expect(b.locator('#hud')).toContainText('2/4');await expect(a.locator('#hud')).toContainText('2/4');await expect(a.locator('#world')).toBeVisible();
 await a.screenshot({path:'test-results/orbit-deck.png'});expect(errors).toEqual([]);await one.close();await two.close();
});

test('movement snapshots reuse graphics resources and remove departed objects',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {createScene}=await import('/scene.js');
  const {createGame,addPlayer,snapshot}=await import('/shared/game.js');
  const canvas=document.createElement('canvas');document.body.append(canvas);
  const view=createScene(canvas),game=createGame('RENDER');
  addPlayer(game,'local','Local');addPlayer(game,'remote','Remote');
  // Keep camera fixed so frustum-driven lazy GPU uploads do not change the baseline.
  game.phase='salvage';view.setMode('scanner');
  view.update(snapshot(game),'local');view.frame(0,0);const before=view.stats();
  for(let i=0;i<120;i++){
   game.players.remote.pos[0]=Math.sin(i/10);game.players.local.pos[2]=5+Math.cos(i/10);
   view.update(snapshot(game),'local');view.frame(i*.001,0);
  }
  const after=view.stats();
  game.players.remote.connected=false;view.update(snapshot(game),'local');view.frame(0,0);
  return {before,after,removed:view.stats()};
 });
 expect(result.after.created).toBe(result.before.created);
 expect(result.after.disposed).toBe(result.before.disposed);
 expect(result.after.geometries).toBe(result.before.geometries);
 expect(result.after.textures).toBe(result.before.textures);
 expect(result.removed.objects).toBe(result.after.objects-1);
 expect(result.removed.disposed).toBe(result.after.disposed+1);
});

test('contracts and room code are accessible; continuous scanner drag allows V',async({browser})=>{
 const {startServer}=await import('../server/index.js');
 const {act,tick,STATIONS}=await import('../shared/game.js');
 const {once}=await import('node:events');
 const app=startServer(0);await once(app.server,'listening');
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+app.server.address().port);
  await page.getByRole('button',{name:'START A CREW'}).click();
  await expect(page.locator('#room-code')).toHaveText(/^[A-F0-9]{6}$/);
  await expect(page.locator('#room-code')).not.toHaveText('');
  const code=await page.locator('#room-code').innerText(),s=app.rooms.get(code),id=s.captain;
  await page.getByRole('button',{name:'Copy code',exact:true}).click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(code);
  await page.keyboard.press('c');
  await expect(page.locator('#panel')).toContainText('Accept contracts anywhere');
  await page.getByRole('button',{name:'Accept · FREE',exact:true}).first().click();
  await expect.poll(()=>s.leads[0].accepted).toBe(true);
  await page.keyboard.press('Escape');
  s.players[id].pos=[...STATIONS.nav];act(s,id,{type:'travel',id:'free-a'});
  for(let i=0;i<180;i++)tick(s,.05);
  s.players[id].pos=[...STATIONS.scanner];
  await expect(page.locator('#prompt')).toContainText('SCANNER');
  await page.keyboard.press('e');
  await page.getByRole('button',{name:'Lock grapple',exact:true}).click();
  await expect.poll(()=>s.wrecks['free-a'].grapple).toBe(true);
  await page.mouse.move(800,420);await page.mouse.down();
  await expect.poll(()=>page.evaluate(()=>!!document.pointerLockElement)).toBe(true);
  await page.mouse.move(1000,420,{steps:30});
  await page.keyboard.press('v');
  await expect.poll(()=>Object.keys(s.wrecks['free-a'].clues).length).toBeGreaterThan(0);
  const first=s.wrecks['free-a'].yaw;
  await page.mouse.move(500,420,{steps:30});
  await expect.poll(()=>s.wrecks['free-a'].yaw).not.toBe(first);
  await page.mouse.up();
  await expect.poll(()=>page.evaluate(()=>!!document.pointerLockElement)).toBe(false);
  expect(errors).toEqual([]);
 }finally{await context.close();await app.close();}
});

test('handheld tractor locks visible cargo and synchronizes input with the server',async({browser})=>{
 const {startServer}=await import('../server/index.js');
 const {act,tick,STATIONS}=await import('../shared/game.js');
 const {once}=await import('node:events');
 const app=startServer(0);await once(app.server,'listening');
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+app.server.address().port);
  await page.getByRole('button',{name:'START A CREW'}).click();
  await expect(page.locator('#room-code')).toHaveText(/^[A-F0-9]{6}$/);
  const code=await page.locator('#room-code').innerText(),s=app.rooms.get(code),id=s.captain;
  act(s,id,{type:'accept',id:'free-a'});
  s.players[id].pos=[...STATIONS.nav];act(s,id,{type:'travel',id:'free-a'});
  for(let i=0;i<180;i++)tick(s,.05);
  const c=s.cargo[0];c.pos[1]=1.1;
  s.players[id].pos=[c.pos[0],0,c.pos[2]+5];
  await expect(page.locator('#crew')).toContainText('SALVAGE');
  await page.waitForTimeout(450);
  await page.mouse.click(640,400);
  await expect.poll(()=>s.players[id].tractor?.id).toBe(c.id);
  await expect(page.locator('#tractor-status')).toContainText('TRACTOR LOCKED');
  const initial=s.players[id].tractor.targetDistance;
  await page.mouse.wheel(0,-450);
  await expect.poll(()=>s.players[id].tractor?.targetDistance).toBeLessThan(initial);
  await page.keyboard.press('q');
  await expect.poll(()=>s.players[id].tractor).toBe(null);
  expect(c.state).toBe('loose');
  expect(errors).toEqual([]);
 }finally{await context.close();await app.close();}
});

test('rear cargo hatch toggles for the crew and its status is visible in the HUD',async({browser})=>{
 const {startServer}=await import('../server/index.js');
 const {STATIONS}=await import('../shared/game.js');
 const {once}=await import('node:events');
 const app=startServer(0);await once(app.server,'listening');
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+app.server.address().port);
  await page.getByRole('button',{name:'START A CREW'}).click();
  await expect(page.locator('#room-code')).toHaveText(/^[A-F0-9]{6}$/);
  const code=await page.locator('#room-code').innerText(),game=app.rooms.get(code),player=game.players[game.captain];
  player.pos=[...STATIONS.hatch];
  await page.keyboard.press('h');
  await expect.poll(()=>game.ship.hatchOpen).toBe(true);
  await expect(page.locator('#hud')).toContainText('AFT HATCH OPEN');
  await page.keyboard.press('h');
  await expect.poll(()=>game.ship.hatchOpen).toBe(false);
  await expect(page.locator('#hud')).toContainText('AFT HATCH CLOSED');
  expect(errors).toEqual([]);
 }finally{await context.close();await app.close();}
});

test('green cargo placement magnetically locks hovering freight using E in the browser',async({browser})=>{
 const {startServer}=await import('../server/index.js');
 const {once}=await import('node:events');
 const app=startServer(0);await once(app.server,'listening');
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+app.server.address().port);
  await page.getByRole('button',{name:'START A CREW'}).click();
  await expect(page.locator('#room-code')).toHaveText(/^[A-F0-9]{6}$/);
  const code=await page.locator('#room-code').innerText(),s=app.rooms.get(code),p=s.players[s.captain];
  s.phase='salvage';p.pos=[1,0,5];
  const c={id:'magnetic-browser',type:'machinery',dims:[2,1,2],pos:[1.15,1.35,5.1],angle:.3,state:'tractored',carrier:p.id};
  s.cargo.push(c);
  p.tractor={id:c.id,distance:4,targetDistance:4,angle:c.angle,targetAngle:c.angle};
  await expect(page.locator('#placement')).toContainText('GREEN GRID');
  await page.keyboard.press('e');
  await expect.poll(()=>c.state).toBe('secured');
  expect(c.cell[1]).toBe(0);
  expect(errors).toEqual([]);
 }finally{await context.close();await app.close();}
});

test('starter 32 m3 bay shows auto-tip tractor placement and secures with E',async({browser})=>{
 const {startServer}=await import('../server/index.js');
 const {once}=await import('node:events');
 const app=startServer(0);await once(app.server,'listening');
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+app.server.address().port);
  await page.getByRole('button',{name:'START A CREW'}).click();
  await expect(page.locator('#room-code')).toHaveText(/^[A-F0-9]{6}$/);
  const code=await page.locator('#room-code').innerText(),s=app.rooms.get(code),p=s.players[s.captain];
  s.phase='salvage';p.pos=[1,0,5];
  const c={id:'full-bay-browser',type:'scrap',dims:[4,2,4],pos:[1,.65,2],angle:0,state:'tractored',carrier:p.id,illegal:false};
  s.cargo.push(c);p.tractor={id:c.id,distance:4,targetDistance:4,angle:0,targetAngle:0};
  await expect(page.locator('#placement')).toContainText('E TO TIP & SECURE');
  await page.keyboard.press('e');
  await expect.poll(()=>c.state).toBe('secured');
  expect(c.packedDims).toEqual([2,4,4]);
  expect(c.container).toBe('bay1');
  expect(errors).toEqual([]);
 }finally{await context.close();await app.close();}
});

test('dockside tractor can pick up a loose orphan crate and cargo console can discard it',async({browser})=>{
 const {startServer}=await import('../server/index.js');
 const {STATIONS}=await import('../shared/game.js');
 const {once}=await import('node:events');
 const app=startServer(0);await once(app.server,'listening');
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+app.server.address().port);
  await page.getByRole('button',{name:'START A CREW'}).click();
  await expect(page.locator('#room-code')).toHaveText(/^[A-F0-9]{6}$/);
  const code=await page.locator('#room-code').innerText(),s=app.rooms.get(code),p=s.players[s.captain];
  const c={id:'old-orphan',type:'alloy',dims:[1,1,1],state:'loose',pos:[1,1.1,2],angle:0};
  s.cargo.push(c);p.pos=[1,0,5];
  await page.waitForTimeout(350);
  await page.mouse.click(640,400);
  await expect.poll(()=>p.tractor?.id).toBe(c.id);
  await expect(page.locator('#tractor-status')).toContainText('TRACTOR LOCKED');
  await page.keyboard.press('q');
  await expect.poll(()=>c.state).toBe('loose');
  p.pos=[...STATIONS.cargo];
  await page.keyboard.press('e');
  await expect(page.locator('#panel')).toContainText('UNSECURED:');
  await page.getByRole('button',{name:'Discard loose crate'}).click();
  await expect.poll(()=>c.state).toBe('lost');
  expect(errors).toEqual([]);
 }finally{await context.close();await app.close();}
});
test('selling at the quota deadline triggers automatic payment and new seven-day cycle',async({browser})=>{
 const {startServer}=await import('../server/index.js');
 const {STATIONS}=await import('../shared/game.js');
 const {once}=await import('node:events');
 const app=startServer(0);await once(app.server,'listening');
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+app.server.address().port);
  await page.getByRole('button',{name:'START A CREW'}).click();
  await expect(page.locator('#room-code')).toHaveText(/^[A-F0-9]{6}$/);
  const code=await page.locator('#room-code').innerText(),s=app.rooms.get(code),p=s.players[s.captain];
  s.quota.days=7;s.quota.due=true;s.credits=1450;p.pos=[...STATIONS.market];
  s.cargo.push({id:'payday',type:'alloy',dims:[1,1,1],state:'secured',container:'bay1',cell:[0,0,0],packedDims:[1,1,1]});
  await expect(page.locator('#hud')).toContainText('DAY 7/7');
  await page.keyboard.press('e');
  await page.getByRole('button',{name:'Sell all accepted cargo'}).click();
  await expect.poll(()=>s.quota.number).toBe(2);
  await expect(page.locator('#hud')).toContainText('DAY 0/7');
  expect(errors).toEqual([]);
 }finally{await context.close();await app.close();}
});
