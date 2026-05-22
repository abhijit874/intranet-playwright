import { test, expect } from '@playwright/test';
import { login } from './intranet/utils/login_helper';

test('login', async ({ page }) => {
  await login(page);
  await page.screenshot({ path: 'screenshots/login.png' });
});