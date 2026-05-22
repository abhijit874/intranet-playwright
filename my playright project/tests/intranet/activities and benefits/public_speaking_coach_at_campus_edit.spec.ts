import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('edit existing public speaking coach at campus contribution', async ({ page }) => {
  const updatedTitle = `campus-workshop-edited-${Date.now()}`;

  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();

  const editable = await activitiesPage.openEditableFromSearchTerms(['Coach at Campus', 'Public speaking', 'random college talk topic'], { throwOnMissing: false });
  test.skip(!editable, 'Record is approved/locked. Skipping edit execution.');

  await page.getByLabel('Title:').fill(updatedTitle);
  await page.getByLabel('Location *').fill('Mumbai');
  await activitiesPage.submitEdit();
});
