import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

const employeeName = 'Aastha Bhargava';  // change before running
const projectName  = '';                  // change before running

test('view employee profile on current pool tab', async ({ page }) => {
  const poolPage = new PoolReportPage(page);
  await poolPage.loginAs('admin');
  await poolPage.navigateTo();
  await poolPage.searchEmployee(employeeName, projectName);
  await poolPage.clickEmployeeProfileLink(employeeName);
  await poolPage.assertProfilePageOpened(employeeName);
});
