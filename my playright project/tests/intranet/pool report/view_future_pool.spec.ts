import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

test('view future pool report as leader', async ({ page }) => {
  const poolPage = new PoolReportPage(page);
  await poolPage.loginAs('leader');
  await poolPage.navigateTo();
  await poolPage.navigateToFuturePool();
  await poolPage.assertPoolReportLoaded();
});
