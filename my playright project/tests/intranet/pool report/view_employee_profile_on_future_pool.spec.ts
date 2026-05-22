import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

const employeeName = 'Abhijit Kasbe';  // change before running

test('view employee profile on future pool', async ({ page }) => {
  const poolPage = new PoolReportPage(page);
  await poolPage.loginAs('admin');
  await poolPage.navigateTo();
  await poolPage.navigateToFuturePool();
  await poolPage.searchEmployee(employeeName);
  await poolPage.clickEmployeeProfileLink(employeeName);
  await poolPage.assertProfilePageOpened(employeeName);
});
