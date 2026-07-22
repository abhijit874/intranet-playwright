import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { futureDateValue } from '../utils/test_helpers';

// Negative test — the Activity Date must not allow a future date. The native
// date input blocks it with `max=today`, but a future value can still be forced
// in (via JS, devtools, or a tampered request). This test forces tomorrow's
// date and submits: the system must reject it. submitAndAssertRejected() inspects
// the create POST's response — a 3xx redirect means a future-dated record was
// actually created, so the test fails (bug caught).
const stamp = Date.now();
const TITLE = `future date validation ${stamp}`; // unique, so the lookup is exact
const BLOG_URL = `https://future-date.com/${stamp}`;
const FUTURE_DATE = futureDateValue(1); // tomorrow

test('create contribution — future Activity Date is rejected', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Blog Writing');
  await contributionsPage.fillTitle(TITLE);

  // Confirm the input is configured to block future dates (max = today)...
  await contributionsPage.assertActivityDateRange();

  // ...then force a future date past that guard and try to save it anyway.
  await contributionsPage.forceActivityDate(FUTURE_DATE);
  await contributionsPage.fillFieldByLabel('Blog URL *', BLOG_URL);
  await page.locator('#published_on').selectOption('Self');

  // The contribution must NOT be saved: submitAndAssertRejected fails if the
  // server accepts it (a 3xx redirect = a future-dated record was created).
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});
