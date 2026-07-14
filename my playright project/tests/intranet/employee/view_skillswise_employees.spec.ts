import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';

test('filter employees by skill', async ({ page }) => {
  const employeePage = new EmployeeListPage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.filterBySkill('.Net');
  await employeePage.switchToCompactView();
  await expect(page.locator('#user_table')).toBeVisible();
});
