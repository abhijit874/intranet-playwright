import { test } from '@playwright/test';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';

test('reject activity', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('hr');
  await activitiesPage.navigateToContributionsApproval();
  await activitiesPage.rejectContribution('claude', '11/05/2026', 'Abhijit Kasbe');
});
