import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

test('submit innovation in action contribution', async ({ page }) => {
  const activityDate = validCurrentQuarterDate();
  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Innovation Lab');
  await contributionsPage.selectSubcategory('Innovation in Action');
  await contributionsPage.fillTitle('open code');
  await contributionsPage.fillDate(activityDate);
  await page.getByLabel('Activity Start Date *').fill(activityDate);
  await page.getByLabel('Activity End Date *').fill(activityDate);
  await contributionsPage.fillFieldByLabel('Description', 'this is the test');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();
});

// Self-contained: creates a fresh Innovation in Action record with a unique title,
// then opens that exact record and edits it.
test('edit existing innovation in action contribution', async ({ page }) => {
  const originalTitle = `innovation-action-${Date.now()}`;
  const updatedTitle = `innovation-action-edited-${Date.now()}`;
  const activityDate = validCurrentQuarterDate();

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  // create the record this test will edit
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Innovation Lab');
  await contributionsPage.selectSubcategory('Innovation in Action');
  await contributionsPage.fillTitle(originalTitle);
  await contributionsPage.fillDate(activityDate);
  await page.getByLabel('Activity Start Date *').fill(activityDate);
  await page.getByLabel('Activity End Date *').fill(activityDate);
  await contributionsPage.fillFieldByLabel('Description', 'this is the test');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();

  // open that exact record and edit it
  await contributionsPage.navigateToContributions();
  await contributionsPage.openRowForEdit(originalTitle);
  await contributionsPage.fillTitle(updatedTitle);
  await contributionsPage.fillFieldByLabel('Description', 'edited description');
  await contributionsPage.submitEdit();
  await contributionsPage.assertUpdated();
});

// SERVER-SIDE validation check.
// forceActivityDate() sets the date via JS, bypassing the browser's client-side
// validation (the same way a malicious user or direct API call would). The
// backend MUST still reject a future date. submitAndAssertRejected() inspects the
// create POST's response: a 3xx redirect means a record was actually created, so
// the test fails — that failure is the bug being tracked.
const FUTURE_DATE = '2026-12-11'; // a future date the app must reject

test('innovation in action — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `innovation-action-future-${stamp}`; // unique per run, avoids collisions
  const validDate = validCurrentQuarterDate();

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Innovation Lab');
  await contributionsPage.selectSubcategory('Innovation in Action');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await page.getByLabel('Activity Start Date *').fill(validDate);
  await page.getByLabel('Activity End Date *').fill(validDate);
  await contributionsPage.fillFieldByLabel('Description', 'this is the test');
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('innovation in action — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `innovation-action-prevq-${stamp}`; // unique per run, avoids collisions
  const validDate = validCurrentQuarterDate();

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Innovation Lab');
  await contributionsPage.selectSubcategory('Innovation in Action');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await page.getByLabel('Activity Start Date *').fill(validDate);
  await page.getByLabel('Activity End Date *').fill(validDate);
  await contributionsPage.fillFieldByLabel('Description', 'this is the test');
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
