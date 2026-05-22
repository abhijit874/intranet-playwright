import { test, expect } from '@playwright/test';
test('login',async({page})=>{
await page.goto('https://pg-stage-intranet.joshsoftware.com/');
await page.getByPlaceholder('email').fill('abhijit.kasbe@joshsoftware.com');
await page.getByPlaceholder('password').fill('josh123');
await page.getByRole('button', { name: /sign in/i }).click();
await expect(
  page.getByRole('alert')
).toHaveText(/signed in successfully/i);

const [supportPage] = await Promise.all([
  page.waitForEvent('popup'),
  page.locator('a.nav-link:has-text("Support")').click(),
]);


});