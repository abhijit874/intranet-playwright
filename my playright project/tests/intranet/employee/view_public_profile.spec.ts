import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('view own public profile', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('employee');
  await employeePage.navigateToProfile();
  await expect(page).toHaveURL(/profile/i);
});
