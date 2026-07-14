import { test, expect } from '@playwright/test';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('view own employee details', async ({ page }) => {
  const profilePage = new EmployeeProfilePage(page);
  await profilePage.loginAs('employee');
  await profilePage.navigateToProfile();
  await profilePage.clickProfileTab('Employee details');
  await expect(page.getByRole('tab', { name: 'Employee details' })).toHaveAttribute('aria-selected', 'true');
});
