import { test, expect } from '@playwright/test';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('view own personal details (private profile)', async ({ page }) => {
  const profilePage = new EmployeeProfilePage(page);
  await profilePage.loginAs('employee');
  await profilePage.navigateToProfile();
  await profilePage.clickProfileTab('Personal Details');
  await expect(page.getByRole('tab', { name: 'Personal Details' })).toHaveAttribute('aria-selected', 'true');
});
