import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test.skip('edit existing public speaking project showcase contribution', async ({ page }) => {
  const updatedTitle = `project-showcase-edited-${Date.now()}`;

  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('employee');
  await activitiesPage.navigateToContributions();

  const editable = await activitiesPage.openEditableFromSearchTerms(['Project Showcase', 'Public speaking', 'project showcase'], { throwOnMissing: false });
  test.skip(!editable, 'Record is approved/locked. Skipping edit execution.');

  await page.getByLabel('Title:').fill(updatedTitle);
  await activitiesPage.submitEdit();
});
