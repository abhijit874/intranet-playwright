import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';

test('view Innovation Lab as leader', async ({ page }) => {
  const innovationLabPage = new InnovationLabPage(page);
  await innovationLabPage.loginAs('leader');
  await innovationLabPage.navigateTo();
  await innovationLabPage.assertInnovationLabLoaded();
});
