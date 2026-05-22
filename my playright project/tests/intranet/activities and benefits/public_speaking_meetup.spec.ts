import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('public speaking contribution', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();
  await activitiesPage.clickAddContribution();
  await activitiesPage.selectCategory('Public speaking');
  await activitiesPage.selectSubcategory('Meetup');
  await activitiesPage.fillTitle('codex open AI');
  await activitiesPage.fillDate('2026-04-03');
  await activitiesPage.fillFieldByLabel('Location *', 'Pune');
  await activitiesPage.fillFieldByLabel('Meetup Type *', 'offline');
  await activitiesPage.fillFieldByLabel('Number of Attendees *', '50');
  await activitiesPage.attachFile('#attachment', 'tests/fixtures/image.png');
  await activitiesPage.fillFieldByLabel('URL *', ' https://openai.com');
  await activitiesPage.submitContribution();
});
