import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('search specific employee record', async ({ page }) => {
  test.setTimeout(60000);
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await expect(page.locator('#user_table tbody tr').first()).toBeVisible();
});
