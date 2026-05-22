import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('view other employee personal details (private profile)', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await employeePage.clickProfileTab('Personal Details');
  await expect(page.getByRole('tab', { name: 'Personal Details' })).toHaveAttribute('aria-selected', 'true');
});
