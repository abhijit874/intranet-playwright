import { test, expect } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('login', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Blog Writing');
  await activitiesPage.fillTitle('Claude');
  await activitiesPage.fillDate('2026-05-11');
  await activitiesPage.fillFieldByLabel('Blog URL *', 'https://claude.com');
  await page.locator('#published_on').selectOption('Self');
  await activitiesPage.submitContribution();
  await expect(page.getByRole('alert')).toContainText(/success|created|submitted/i);
});
