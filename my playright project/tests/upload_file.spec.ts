import { test } from '@playwright/test';
import { ActivitiesPage } from './intranet/pages/activities/ActivitiesPage';

test('upload file in contribution', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs();
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Innovation Lab');
  await activitiesPage.selectSubcategory('Monthly Contribution');
  await activitiesPage.fillTitle('upload file');
  await activitiesPage.fillDate('2026-09-01');
  await activitiesPage.attachFile('#timesheet_attachment', 'tests/fixtures/image.png');
  await activitiesPage.submitContribution();
});
