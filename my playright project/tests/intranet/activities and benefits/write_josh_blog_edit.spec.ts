import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('edit existing josh blog contribution', async ({ page }) => {
  const updatedTitle = `playwright-josh-edited-${Date.now()}`;

  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();

  const editable = await activitiesPage.openEditableFromSearchTerms(['playwright', 'Blog Writing', 'Josh'], { throwOnMissing: false });
  test.skip(!editable, 'Record is approved/locked. Skipping edit execution.');

  await activitiesPage.fillTitle(updatedTitle);
  await activitiesPage.fillFieldByLabel('Blog URL *', 'https://playwright.in/edited');
  await activitiesPage.submitEdit();
});
