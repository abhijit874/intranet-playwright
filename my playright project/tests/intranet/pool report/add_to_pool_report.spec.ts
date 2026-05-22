import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

const employeeName = 'Abhijit Kasbe';  // change before running
const projectName  = 'Iziel: Solution architect + Developer (Renewal)';   // change before running

test('add to pool report', async ({ page }) => {
  const poolPage = new PoolReportPage(page);
  await poolPage.loginAs('admin');
  await poolPage.navigateTo();
  await poolPage.navigateToFuturePool();
  await poolPage.searchEmployee(employeeName, projectName);
  await poolPage.clickAddToPool(employeeName, projectName);
  await poolPage.confirmAddToPool();
  await poolPage.assertAddedToPool();
});
