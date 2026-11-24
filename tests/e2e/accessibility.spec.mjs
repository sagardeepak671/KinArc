import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile} from 'node:fs/promises';
test('WCAG automated checks on core routes in both themes, plus keyboard entry',async({page})=>{
 test.setTimeout(120000);await page.goto('/#home');await page.locator('#onboardingSkip').click();const reports=[];
 for(const theme of ['light','dark']){await page.goto('/#settings');await page.locator('#setting-theme').selectOption(theme);for(const route of ['landing','home','library','workbench','journal','plan','progress','coach','settings','profiles','help']){await page.goto('/#'+route);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();reports.push({theme,route,violations:result.violations});}}
 await writeFile('docs/design/accessibility.json',JSON.stringify(reports,null,2));expect(reports.flatMap(r=>r.violations.map(v=>({theme:r.theme,route:r.route,id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})))).toEqual([]);
 await page.goto('/?keyboard=1');await expect(page.locator('body')).not.toHaveClass(/booting/);await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#mainContent')).toBeFocused();await expect(page.locator('body')).toHaveAttribute('data-page','home');
});
