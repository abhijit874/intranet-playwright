import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('update other employee role', async ({ page }) => {
  test.setTimeout(90000);
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await employeePage.updateEmployeeRole('Manager');
  await expect(page.locator('#flashes')).toBeVisible();
});
