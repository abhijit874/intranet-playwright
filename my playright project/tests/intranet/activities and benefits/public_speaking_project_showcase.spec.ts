import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('public speaking contribution', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Public speaking');
  await activitiesPage.selectSubcategory('Project Showcase');
  await page.getByLabel('Title:').fill('project showcase');
  await page.getByLabel('Activity Date:').fill('2026-04-09');
  await page.locator('#project_id').selectOption('RN#1 Brandscope');
  await page.locator('#team_member_ids_26').check();
  await page.locator('#team_member_ids_188').check();
  await activitiesPage.submitContribution();
});
