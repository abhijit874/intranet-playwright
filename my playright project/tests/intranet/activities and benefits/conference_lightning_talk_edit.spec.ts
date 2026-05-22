import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('edit existing conference lightning talk contribution', async ({ page }) => {
  const updatedTitle = `conference-lightning-edited-${Date.now()}`;

  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();

  const editable = await activitiesPage.openEditableFromSearchTerms(['Lightning Talk', 'Conference', 'open code'], { throwOnMissing: false });
  test.skip(!editable, 'Record is approved/locked. Skipping edit execution.');

  await activitiesPage.fillTitle(updatedTitle);
  await activitiesPage.submitEdit();
});
