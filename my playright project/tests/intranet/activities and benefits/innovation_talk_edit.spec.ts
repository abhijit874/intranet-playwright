import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('edit existing innovation talk contribution', async ({ page }) => {
  const updatedTitle = `innovation-talk-edited-${Date.now()}`;

  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();

  const editable = await activitiesPage.openEditableFromSearchTerms(['Innovation Talk', 'Innovation Lab', 'open code'], { throwOnMissing: false });
  test.skip(!editable, 'Record is approved/locked. Skipping edit execution.');

  await activitiesPage.fillTitle(updatedTitle);
  await activitiesPage.fillFieldByLabel('Description', 'edited innovation talk');
  await activitiesPage.submitEdit();
});
