import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('filter employees by location', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.filterByLocation('Pune');
  await employeePage.switchToCompactView();
  await expect(page.locator('#user_table')).toBeVisible();
});
