import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('open source contribution', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Open Source Contribution');
  await activitiesPage.selectSubcategory('Open Source');
  await activitiesPage.fillTitle('playwright automation');
  await activitiesPage.fillDate('2026-03-25');
  await activitiesPage.fillFieldByLabel('Repository handle (URL) *', 'https://codex.com');
  await activitiesPage.fillFieldByLabel('PR link *', 'chatgpt.com');
  await activitiesPage.fillFieldByLabel('Repository name *', 'AI automation');
  await activitiesPage.fillFieldByLabel('Library URL *', 'https://opencode.com');
  await activitiesPage.submitContribution();
});
