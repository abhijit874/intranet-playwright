import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('view own employee details', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('employee');
  await employeePage.navigateToProfile();
  await employeePage.clickProfileTab('Employee details');
  await expect(page.getByRole('tab', { name: 'Employee details' })).toHaveAttribute('aria-selected', 'true');
});
