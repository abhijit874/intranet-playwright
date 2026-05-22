import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('view other employee public profile', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await expect(page).toHaveURL(/profile|users/i);
});
