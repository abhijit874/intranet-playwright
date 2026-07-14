import { test, expect } from '@playwright/test';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('update own skills', async ({ page }) => {
  const profilePage = new EmployeeProfilePage(page);
  await profilePage.loginAs('employee');
  await profilePage.navigateToProfile();
  await profilePage.clickProfileTab('Skills');
  await profilePage.updateSkills('React-Native', 'Dart');
  const alert = page.locator('#flashes');
  await expect(alert).toBeVisible();
  await expect(alert).toHaveClass(/alert-success/);
});
