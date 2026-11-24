import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
test('public exploration does not request setup, app entry does, return visits open overview',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#landing')).toBeVisible();await expect(page.locator('#onboarding')).not.toBeVisible();await page.locator('.public-nav').getByRole('link',{name:'Exercises',exact:true}).click();await expect(page.locator('#shelf button')).toHaveCount(10);await expect(page.locator('#onboarding')).not.toBeVisible();await page.locator('#shelf button').filter({hasText:'Hammer curl'}).click();await expect(page.locator('#detailContent h1')).toHaveText('Hammer curl');await page.locator('#detailSets').fill('2');await page.locator('#detailReps').fill('7');await page.getByRole('button',{name:'Configure practice',exact:true}).click();await expect(page.locator('#onboarding')).toBeVisible();await page.locator('#onboardingSkip').click();await expect(page.locator('#sets')).toHaveValue('2');await expect(page.locator('#goal')).toHaveValue('7');await page.goto('/');await expect(page.locator('#studioHome')).toBeVisible();expect(errors).toEqual([]);
});
test('new dashboard avoids empty statistics and discovery links open real guides',async({page})=>{
 await page.goto('/#home');await page.locator('#onboardingSkip').click();await expect(page.locator('.home-stats')).toBeHidden();await expect(page.locator('#homeExtras')).toContainText('Your first workout starts here');await page.locator('#homeDiscovery button').filter({hasText:'Arm raise'}).click();await expect(page.locator('#detailContent')).toContainText('Front view');await expect(page.locator('#detailContent img')).toHaveAttribute('src','images/exercises/arm-raise.svg');await page.getByRole('button',{name:'Save favorite',exact:true}).click();await page.goto('/#library');await page.locator('#favoriteFilter').click();await expect(page.locator('#shelf button:visible')).toHaveCount(1);await page.reload();await page.locator('#favoriteFilter').click();await expect(page.locator('#shelf button:visible')).toHaveCount(1);
});
test('responsive design matrix: six widths, both themes, key screens and dialogs',async({page})=>{
 test.setTimeout(180000);const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('localhost')&&r.status()>=400)failed.push(r.status()+' '+r.url())});await page.goto('/#home');await page.locator('#onboardingSkip').click();await mkdir('docs/design/screenshots',{recursive:true});const results=[];
 for(const theme of ['light','dark']){
  await page.goto('/#settings');await page.locator('#setting-theme').selectOption(theme);await expect(page.locator('#toast')).toBeHidden({timeout:8000});
  for(const width of [320,390,768,1024,1440,1920]){
   await page.setViewportSize({width,height:width<700?844:1000});
   for(const route of ['landing','home','library','workbench','plan','journal','progress','coach','settings','profiles','help']){
    await page.goto('/#'+route);await expect(page.locator('body')).not.toHaveClass(/booting/);const size=await page.evaluate(()=>({full:document.documentElement.scrollWidth,width:innerWidth}));expect(size.full,`${route}, ${theme}, ${width}`).toBeLessThanOrEqual(size.width+1);
    const broken=await page.locator('img:visible').evaluateAll(imgs=>imgs.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src));expect(broken).toEqual([]);
    await page.screenshot({path:`docs/design/screenshots/${route}-${width}-${theme}.png`,animations:'disabled',fullPage:true});results.push({route,width,theme,overflow:false});
   }
   await page.goto('/#library');await page.locator('#shelf button').first().click();await page.screenshot({path:`docs/design/screenshots/detail-${width}-${theme}.png`,animations:'disabled',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
   if(width===390||width===1440){await page.getByRole('button',{name:'Watch demonstration'}).click();await expect(page.locator('#lesson')).toBeVisible();await page.screenshot({path:`docs/design/screenshots/trial-${width}-${theme}.png`,animations:'disabled'});await page.getByRole('button',{name:'Back to practice'}).click()}
  }
 }
 expect(errors).toEqual([]);expect(failed).toEqual([]);await writeFile('docs/design/visual-matrix.json',JSON.stringify({results,exceptions:errors,failedLocalResources:failed,note:'Automated Chromium screenshot/overflow matrix; visual review documented separately.'},null,2));
});
