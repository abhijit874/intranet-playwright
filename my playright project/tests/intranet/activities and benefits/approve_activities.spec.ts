import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('approve activities', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('hr');
  await activitiesPage.navigateToContributionsApproval();
  await activitiesPage.approveContribution('claude AI ', '12/05/2026', 'Aastha');
});
