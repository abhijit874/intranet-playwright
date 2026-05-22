import { test, expect } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('submit conference CFP contribution', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Conference');
  await activitiesPage.selectSubcategory('CFP');
  await activitiesPage.fillTitle('codex');
  await activitiesPage.fillDate('2026-03-13');
  await activitiesPage.submitContribution();
  await expect(page.locator('#flashes')).toContainText('Contribution saved successfully');
});
