import { test } from '@playwright/test';
import { FuturePoolPage } from '../pages/FuturePoolPage';

const employeeName = 'Abhijit Kasbe';  // change before running
const projectName  = 'Iziel: Solution architect + Developer (Renewal)';   // change before running

test('add to pool report', async ({ page }) => {
  const futurePoolPage = new FuturePoolPage(page);
  await futurePoolPage.loginAs('admin');
  await futurePoolPage.navigateTo();
  await futurePoolPage.navigateToFuturePool();
  await futurePoolPage.searchEmployee(employeeName, projectName);
  await futurePoolPage.clickAddToPool(employeeName, projectName);
  await futurePoolPage.confirmAddToPool();
  await futurePoolPage.assertAddedToPool();
});
