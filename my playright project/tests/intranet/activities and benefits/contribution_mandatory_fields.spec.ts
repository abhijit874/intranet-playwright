import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';

test('mandatory fields - contribution must not be saved without required data', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  // Submit without selecting category, subcategory, title, or date.
  // submitAndAssertRejected fails if the server accepts it (a 3xx redirect = a
  // record was created); a client-blocked submit or a re-rendered form passes.
  await contributionsPage.submitAndAssertRejected('missing required fields');
});
