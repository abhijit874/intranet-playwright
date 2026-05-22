import { test, expect } from '@playwright/test';
import { login } from './intranet/utils/login_helper';

test('login flow succeeds', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/pg-stage-intranet/i);
  await expect(page.getByText('Hello,')).toBeVisible();
});
