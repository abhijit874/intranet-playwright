import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('view own assets', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('employee');
  await employeePage.navigateToProfile();
  await employeePage.clickProfileTab('Assets');
  await expect(page.getByRole('tab', { name: 'Assets' })).toHaveAttribute('aria-selected', 'true');
});
