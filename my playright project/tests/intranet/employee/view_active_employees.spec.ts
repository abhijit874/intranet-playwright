import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';

test('shows list of active and on-notice employees', async ({ page }) => {
  const employeePage = new EmployeeListPage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await expect(page.locator('#user_table')).toBeVisible();
});
