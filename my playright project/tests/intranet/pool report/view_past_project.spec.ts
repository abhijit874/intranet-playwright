import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

const employeeName = 'Aastha Bhargava';  // change before running
const projectName  = 'Pool-BFSI';                  // change before running

test('view past project', async ({ page }) => {
  const poolPage = new PoolReportPage(page);
  await poolPage.loginAs('admin');
  await poolPage.navigateTo();
  await poolPage.searchEmployee(employeeName, projectName);
  await poolPage.clickViewPastProjects(employeeName);
  await poolPage.assertPastProjectsPageOpened();
});
