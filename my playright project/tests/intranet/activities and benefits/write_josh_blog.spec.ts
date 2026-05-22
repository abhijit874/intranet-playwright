import { test, expect } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('login', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Blog Writing');
  await activitiesPage.fillTitle('playwright');
  await activitiesPage.fillDate('2026-03-11');
  await activitiesPage.fillFieldByLabel('Blog URL *', 'https://playwright.in');
  await page.locator('#published_on').selectOption('Josh blogpost');
  await activitiesPage.submitContribution();
  await expect(page.getByRole('alert')).toContainText(/success|created|submitted/i);
});
