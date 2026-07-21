import { test, expect } from '@playwright/test';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('update own skills', async ({ page }) => {
  const profilePage = new EmployeeProfilePage(page);
  await profilePage.loginAs('employee');
  await profilePage.navigateToProfile();
  await profilePage.clickProfileTab('Skills');
  await profilePage.updateRandomSkills();
  // Success flashes render as "alert-info" here and auto-dismiss, so assert the
  // class in one retrying check rather than a separate toBeVisible() first.
  await expect(page.locator('#flashes')).toHaveClass(/alert-info/, { timeout: 15000 });
});
