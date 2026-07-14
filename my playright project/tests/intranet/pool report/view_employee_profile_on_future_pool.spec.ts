import { test } from '@playwright/test';
import { FuturePoolPage } from '../pages/FuturePoolPage';

const employeeName = 'Abhijit Kasbe';  // change before running

test('view employee profile on future pool', async ({ page }) => {
  const futurePoolPage = new FuturePoolPage(page);
  await futurePoolPage.loginAs('admin');
  await futurePoolPage.navigateTo();
  await futurePoolPage.navigateToFuturePool();
  await futurePoolPage.searchEmployee(employeeName);
  await futurePoolPage.clickEmployeeProfileLink(employeeName);
  await futurePoolPage.assertProfilePageOpened(employeeName);
});
