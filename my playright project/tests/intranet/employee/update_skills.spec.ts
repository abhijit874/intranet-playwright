import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('update own skills', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('employee');
  await employeePage.navigateToProfile();
  await employeePage.clickProfileTab('Skills');
  await employeePage.updateSkills('React-Native', 'Dart');
  await expect(page.locator('#flashes')).toBeVisible();
});
