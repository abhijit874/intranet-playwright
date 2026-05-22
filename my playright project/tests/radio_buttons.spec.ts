import { test, expect } from '@playwright/test';
test('login',async({page})=>{
await page.goto('https://pg-stage-intranet.joshsoftware.com/');
await page.getByPlaceholder('email').fill('saurabh.gaji@joshsoftware.com');
await page.getByPlaceholder('password').fill('josh123');
await page.getByRole('button', { name: /sign in/i }).click();
await expect(
  page.getByRole('alert')
).toHaveText(/signed in successfully/i);
await page.locator('body > div.d-flex.h-100 > aside > nav > a:nth-child(1) > span').click();

await page.getByText('See Compact View').click();
await page.locator('#dt-search-0').fill('abhijit kasbe')
await page.locator('#user_table > tbody > tr > td:nth-child(7) > a > i').click();
await page.locator('#user_allow_backdated_timesheet_entry_false').check();


});