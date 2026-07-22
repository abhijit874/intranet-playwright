import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';

test('login', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickRedeem();
  await contributionsPage.confirmRedeem();
});
