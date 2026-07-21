import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';

test('view other employee public profile', async ({ page }) => {
  const employeePage = new EmployeeListPage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  const employeeName = await employeePage.getFirstEmployeeName();
  await employeePage.searchEmployee(employeeName);
  await employeePage.clickEmployeeProfileIcon();
  await expect(page).toHaveURL(/profile|users/i);
});
