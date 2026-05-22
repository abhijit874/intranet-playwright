import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test.skip('edit existing open source gem contribution', async ({ page }) => {
  const updatedTitle = `open-source-gem-edited-${Date.now()}`;

  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();

  const editable = await activitiesPage.openEditableFromSearchTerms(['Develop new Gem', 'Open Source Contribution', 'open AI'], { throwOnMissing: false });
  test.skip(!editable, 'Record is approved/locked. Skipping edit execution.');

  await activitiesPage.fillTitle(updatedTitle);
  await activitiesPage.fillFieldByLabel('Description *', 'edited playwright automation');
  await activitiesPage.submitEdit();
});
