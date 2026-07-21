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
  const employeeName = await employeePage.getFirstEmployeeName();
  await employeePage.searchEmployee(employeeName);
  await employeePage.clickEmployeeProfileIcon();
  await profilePage.updateEmployeeRole('Manager');
  // This app styles its success flashes as "alert-info" (same as the allocation
  // module). Assert the class in one retrying check — the flash auto-dismisses,
  // so a separate toBeVisible() first would race with it fading.
  await expect(page.locator('#flashes')).toHaveClass(/alert-info/, { timeout: 15000 });
});
