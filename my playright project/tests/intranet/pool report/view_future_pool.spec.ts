import { test } from '@playwright/test';
import { FuturePoolPage } from '../pages/FuturePoolPage';

test('view future pool report as leader', async ({ page }) => {
  const futurePoolPage = new FuturePoolPage(page);
  await futurePoolPage.loginAs('leader');
  await futurePoolPage.navigateTo();
  await futurePoolPage.navigateToFuturePool();
  await futurePoolPage.assertPoolReportLoaded();
});
