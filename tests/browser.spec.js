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
