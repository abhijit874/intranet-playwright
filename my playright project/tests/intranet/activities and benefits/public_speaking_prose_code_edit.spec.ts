import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('edit existing public speaking prose and code contribution', async ({ page }) => {
  const updatedTitle = `prose-code-edited-${Date.now()}`;

  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();

  const editable = await activitiesPage.openEditableFromSearchTerms(['Prose & Code', 'Public speaking', 'prose and code'], { throwOnMissing: false });
  test.skip(!editable, 'Record is approved/locked. Skipping edit execution.');

  await page.getByLabel('Title:').fill(updatedTitle);
  await page.locator('#duration').fill('50');
  await activitiesPage.submitEdit();
});
