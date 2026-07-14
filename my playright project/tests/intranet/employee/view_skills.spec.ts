import { test, expect } from '@playwright/test';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('view own skills', async ({ page }) => {
  const profilePage = new EmployeeProfilePage(page);
  await profilePage.loginAs('employee');
  await profilePage.navigateToProfile();
  await profilePage.clickProfileTab('Skills');
  await expect(page.getByRole('tab', { name: 'Skills' })).toHaveAttribute('aria-selected', 'true');
});
