import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';

test('shows list of all employees with all statuses', async ({ page }) => {
  const employeePage = new EmployeeListPage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.showAllEmployees();
  await expect(page.locator('#user_table')).toBeVisible();
});
