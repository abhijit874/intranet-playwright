import { test, expect } from '@playwright/test';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('view own assets', async ({ page }) => {
  const profilePage = new EmployeeProfilePage(page);
  await profilePage.loginAs('employee');
  await profilePage.navigateToProfile();
  await profilePage.clickProfileTab('Assets');
  await expect(page.getByRole('tab', { name: 'Assets' })).toHaveAttribute('aria-selected', 'true');
});
