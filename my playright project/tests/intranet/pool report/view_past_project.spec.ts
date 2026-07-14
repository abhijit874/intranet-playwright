import { test } from '@playwright/test';
import { FuturePoolPage } from '../pages/FuturePoolPage';

const employeeName = 'Aastha Bhargava';  // change before running
const projectName  = 'Pool-BFSI';                  // change before running

test('view past project', async ({ page }) => {
  const futurePoolPage = new FuturePoolPage(page);
  await futurePoolPage.loginAs('admin');
  await futurePoolPage.navigateTo();
  await futurePoolPage.searchEmployee(employeeName, projectName);
  await futurePoolPage.clickViewPastProjects(employeeName);
  await futurePoolPage.assertPastProjectsPageOpened();
});
