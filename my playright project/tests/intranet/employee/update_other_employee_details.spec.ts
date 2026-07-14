import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('update other employee role', async ({ page }) => {
  test.setTimeout(90000);
  const employeePage = new EmployeeListPage(page);
  const profilePage = new EmployeeProfilePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await profilePage.updateEmployeeRole('Manager');
  const alert = page.locator('#flashes');
  await expect(alert).toBeVisible();
  await expect(alert).toHaveClass(/alert-success/);
});
