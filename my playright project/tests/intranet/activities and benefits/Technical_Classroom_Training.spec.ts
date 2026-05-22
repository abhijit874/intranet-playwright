import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('technical classroom training', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('hr');
  await activitiesPage.navigateToCreateLdRecord();
  await activitiesPage.selectLdCategory('10');
  await activitiesPage.selectLdSubcategory('36');
  await activitiesPage.pressEscape();
  await activitiesPage.fillLdTitle('claude AI');
  await activitiesPage.fillLdDate('2026-05-12');
  await activitiesPage.fillLdDuration('60');
  await activitiesPage.selectLdEmployee('aastha.bhargava@joshsoftware.com (719)');
  await activitiesPage.fillLdDescription('playwright automation with claude');
  await activitiesPage.submitLdRecord();
});
