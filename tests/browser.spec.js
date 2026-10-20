import {test,expect} from '@playwright/test';
test('two browser contexts join the same 3D game',async({browser})=>{
 const one=await browser.newContext(),two=await browser.newContext();const a=await one.newPage(),b=await two.newPage();const errors=[];a.on('pageerror',e=>errors.push(e.message));b.on('pageerror',e=>errors.push(e.message));
 await a.goto('/');await a.getByRole('button',{name:'START A CREW'}).click();await expect(a.locator('#hud')).toBeVisible();
 const hud=await a.locator('#hud').innerText();const code=hud.match(/ORBIT \/ ([A-F0-9]{6})/)[1];
 await b.goto('/');await b.getByLabel('Room code').fill(code);await b.getByRole('button',{name:'JOIN',exact:true}).click();
 await expect(b.locator('#hud')).toContainText('2/4');await expect(a.locator('#hud')).toContainText('2/4');await expect(a.locator('#world')).toBeVisible();
 await a.screenshot({path:'test-results/orbit-deck.png'});expect(errors).toEqual([]);await one.close();await two.close();
});
