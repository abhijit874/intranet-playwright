import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';

test('search specific employee record', async ({ page }) => {
  test.setTimeout(60000);
  const employeePage = new EmployeeListPage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  const employeeName = await employeePage.getFirstEmployeeName();
  await employeePage.searchEmployee(employeeName);
  await expect(page.locator('#user_table tbody tr').first()).toBeVisible();
});
