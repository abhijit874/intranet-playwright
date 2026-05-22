import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('view own skills', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('employee');
  await employeePage.navigateToProfile();
  await employeePage.clickProfileTab('Skills');
  await expect(page.getByRole('tab', { name: 'Skills' })).toHaveAttribute('aria-selected', 'true');
});
