import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('public speaking contribution', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Public speaking');
  await activitiesPage.selectSubcategory('Coach at Campus Workshop (TAG)');
  await page.getByLabel('Title:').fill('random college talk topic');
  await page.getByLabel('Activity Date:').fill('2026-04-06');
  await activitiesPage.fillFieldByLabel('Event details', 'offline');
  await page.getByLabel('Location *').fill('Pune');
  await activitiesPage.fillFieldByLabel('Duration (In minutes) *', '50');
  await activitiesPage.submitContribution();
});
