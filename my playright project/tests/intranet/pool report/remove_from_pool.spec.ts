import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

const employeeName = 'Abhijit Kasbe';  // change before running
const projectName  = 'Iziel: Solution architect + Developer (Renewal)';   // change before running

test('remove from pool', async ({ page }) => {
  const poolPage = new PoolReportPage(page);
  await poolPage.loginAs('admin');
  await poolPage.navigateTo();
  await poolPage.searchEmployee(employeeName, projectName);
  await poolPage.clickRemoveFromPool(employeeName, projectName);
  await poolPage.confirmRemoveFromPool();
  await poolPage.assertRemovedFromPool();
});
