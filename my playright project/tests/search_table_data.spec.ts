import { test, expect } from '@playwright/test';
test('search table data',async({page})=>{
    await page.goto('https://pg-stage-intranet.joshsoftware.com/');
    await page.locator('#user_email').fill('saurabh.gaji@joshsoftware.com')
    await page.locator('#user_password').fill('josh123');
    await page.locator('.btn').click();
    await page.locator('body > div.d-flex.h-100 > aside > nav > a:nth-child(1) > span').click();
    await page.getByText('See Compact View').click();
    const rows=page.locator('#user_table tbody tr');
    const row=rows.filter({hasText:'abhijit kasbe'});
  await Promise.all([
  page.waitForLoadState('networkidle'),
  row.locator('td:nth-child(7) a').click(),
]);

})