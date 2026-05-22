import { test, expect } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('login', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Innovation Lab');
  await activitiesPage.selectSubcategory('Monthly Contribution');
  await activitiesPage.fillTitle('open code');
  await activitiesPage.fillDate('2026-03-24');
  await activitiesPage.attachFile('#timesheet_attachment', 'tests/fixtures/image.png');
  await activitiesPage.submitContribution();
  await expect(page.locator('#flashes')).toContainText('Contribution saved successfully');
});
