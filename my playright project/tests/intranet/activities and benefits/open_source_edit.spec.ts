import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test.skip('edit existing open source contribution', async ({ page }) => {
  const updatedTitle = `open-source-edited-${Date.now()}`;

  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();

  const editable = await activitiesPage.openEditableFromSearchTerms(['Open Source', 'Open Source Contribution', 'playwright automation'], { throwOnMissing: false });
  test.skip(!editable, 'Record is approved/locked. Skipping edit execution.');

  await activitiesPage.fillTitle(updatedTitle);
  await activitiesPage.fillFieldByLabel('Repository name *', 'AI automation edited');
  await activitiesPage.submitEdit();
});
