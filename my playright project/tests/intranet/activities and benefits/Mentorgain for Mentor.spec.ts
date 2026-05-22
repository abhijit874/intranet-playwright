import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('mentorgain for mentor', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('hr');
  await activitiesPage.navigateToCreateLdRecord();
  await activitiesPage.selectLdCategory('10');
  await activitiesPage.selectLdSubcategory('35');
  await activitiesPage.fillLdTitle('claude AI');
  await activitiesPage.fillLdDate('2026-05-12');
  await activitiesPage.selectLdEmployee('aastha.bhargava@joshsoftware.com (719)');
  await activitiesPage.fillLdDescription('playwright automation with claude');
  await activitiesPage.submitLdRecord();
});
