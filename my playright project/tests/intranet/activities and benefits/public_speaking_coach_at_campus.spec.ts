import { test, expect } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

test('public speaking coach at campus contribution', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Coach at Campus Workshop (TAG)');
  await page.getByLabel('Title:').fill('random college talk topic');
  await page.getByLabel('Activity Date:').fill(validCurrentQuarterDate());
  await contributionsPage.fillFieldByLabel('Event details', 'offline');
  await page.getByLabel('Location *').fill('Pune');
  await contributionsPage.fillFieldByLabel('Duration (In minutes) *', '50');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();
});

// Self-contained: creates a fresh Coach at Campus record with a unique title, then
// opens that exact record and edits it.
test('edit existing public speaking coach at campus contribution', async ({ page }) => {
  const originalTitle = `campus-workshop-${Date.now()}`;
  const updatedTitle = `campus-workshop-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  // create the record this test will edit
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Coach at Campus Workshop (TAG)');
  await page.getByLabel('Title:').fill(originalTitle);
  await page.getByLabel('Activity Date:').fill(validCurrentQuarterDate());
  await contributionsPage.fillFieldByLabel('Event details', 'offline');
  await page.getByLabel('Location *').fill('Pune');
  await contributionsPage.fillFieldByLabel('Duration (In minutes) *', '50');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();

  // open that exact record and edit it
  await contributionsPage.navigateToContributions();
  await contributionsPage.openRowForEdit(originalTitle);
  await page.getByLabel('Title:').fill(updatedTitle);
  await page.getByLabel('Location *').fill('Mumbai');
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

test('public speaking coach at campus — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `campus-workshop-future-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Coach at Campus Workshop (TAG)');
  await page.getByLabel('Title:').fill(title);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await contributionsPage.fillFieldByLabel('Event details', 'offline');
  await page.getByLabel('Location *').fill('Pune');
  await contributionsPage.fillFieldByLabel('Duration (In minutes) *', '50');
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('public speaking coach at campus — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `campus-workshop-prevq-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Coach at Campus Workshop (TAG)');
  await page.getByLabel('Title:').fill(title);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await contributionsPage.fillFieldByLabel('Event details', 'offline');
  await page.getByLabel('Location *').fill('Pune');
  await contributionsPage.fillFieldByLabel('Duration (In minutes) *', '50');
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
