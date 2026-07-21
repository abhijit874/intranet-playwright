import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';

test('filter employees by project', async ({ page }) => {
  const employeePage = new EmployeeListPage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.filterByRandomProject();
  await employeePage.switchToCompactView();
  await expect(page.locator('#user_table')).toBeVisible();
});
