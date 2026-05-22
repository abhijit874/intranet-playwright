import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('shows list of all employees with all statuses', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.showAllEmployees();
  await expect(page.locator('#user_table')).toBeVisible();
});
