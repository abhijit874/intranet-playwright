import { test, expect } from '@playwright/test';
test('login',async({page})=>{
await page.goto('https://pg-stage-intranet.joshsoftware.com/');
await page.getByPlaceholder('email').fill('saurabh.gaji@joshsoftware.com');
await page.getByPlaceholder('password').fill('josh123');
await page.getByRole('button', { name: /sign in/i }).click();
await expect(
  page.getByRole('alert')
).toHaveText(/signed in successfully/i);

await page.getByText('Documents').click();
await page.getByText('Holiday List').click();
  page.once('dialog', async dialog => {
    console.log(dialog.message()); // shows the confirm text
    await dialog.accept();         // clicks OK
  });

await page.locator('.ri-delete-bin-line').click();   

});