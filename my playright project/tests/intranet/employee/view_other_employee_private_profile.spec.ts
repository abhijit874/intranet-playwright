import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('view other employee personal details (private profile)', async ({ page }) => {
  const employeePage = new EmployeeListPage(page);
  const profilePage = new EmployeeProfilePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await profilePage.clickProfileTab('Personal Details');
  await expect(page.getByRole('tab', { name: 'Personal Details' })).toHaveAttribute('aria-selected', 'true');
});
