import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('public speaking contribution', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Public speaking');
  await activitiesPage.selectSubcategory('Prose & Code');
  await page.getByLabel('Title:').fill('prose and code');
  await page.getByLabel('Activity Date:').fill('2026-04-09');
  await page.locator('#duration').fill('40');
  await page.locator('#type').selectOption({ label: 'Code' });
  await activitiesPage.fillFieldByLabel('Description *', 'automation of prose and code');
  await activitiesPage.submitContribution();
});
