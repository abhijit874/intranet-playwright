import { test, expect } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('login', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Conference');
  await activitiesPage.selectSubcategory('Presentation in Conference (OFFLINE)');
  await activitiesPage.fillTitle('open code');
  await activitiesPage.fillDate('2026-03-13');
  await activitiesPage.submitContribution();
  await expect(page.locator('#flashes')).toContainText('Contribution saved successfully');
});
