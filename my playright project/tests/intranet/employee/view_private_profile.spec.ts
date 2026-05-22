import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('view own personal details (private profile)', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('employee');
  await employeePage.navigateToProfile();
  await employeePage.clickProfileTab('Personal Details');
  await expect(page.getByRole('tab', { name: 'Personal Details' })).toHaveAttribute('aria-selected', 'true');
});
