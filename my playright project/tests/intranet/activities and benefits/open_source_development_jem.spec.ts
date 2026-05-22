import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('open source development jem', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Open Source Contribution');
  await activitiesPage.selectSubcategory('Develop new Gem / library');
  await activitiesPage.fillTitle('open AI');
  await activitiesPage.fillDate('2026-03-31');
  await activitiesPage.fillFieldByLabel('Library/Gem Name *', 'chat gpt');
  await activitiesPage.fillFieldByLabel('Library/Gem URL *', 'https://openai.com');
  await activitiesPage.fillFieldByLabel('Repository Link *', 'https://openai.com');
  await activitiesPage.fillFieldByLabel('Pull Request Link *', 'https://codex.com');
  await activitiesPage.fillFieldByLabel('Description *', 'playright automation');
  await activitiesPage.submitContribution();
});
