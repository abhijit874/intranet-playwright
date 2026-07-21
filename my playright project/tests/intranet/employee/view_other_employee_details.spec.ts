import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('view other employee details', async ({ page }) => {
  const employeePage = new EmployeeListPage(page);
  const profilePage = new EmployeeProfilePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  const employeeName = await employeePage.getFirstEmployeeName();
  await employeePage.searchEmployee(employeeName);
  await employeePage.clickEmployeeProfileIcon();
  await profilePage.clickProfileTab('Employee details');
  await expect(page.getByRole('tab', { name: 'Employee details' })).toHaveAttribute('aria-selected', 'true');
});
