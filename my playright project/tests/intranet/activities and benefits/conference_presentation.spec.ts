import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

// Fills the conference-specific required fields the subcategory form mandates.
async function fillConferenceRequiredFields(page: import('@playwright/test').Page) {
  await page.getByLabel('Conference name *').fill('Tech Conference');
  await page.getByLabel('Location *').fill('Pune');
  await page.getByLabel('Description *').fill('Conference presentation session');
  await page.getByLabel('Duration (In minutes) *').fill('30');
}

test('submit conference presentation contribution', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Conference');
  await contributionsPage.selectSubcategory('Presentation in Conference (OFFLINE)');
  await contributionsPage.fillTitle('open code');
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await fillConferenceRequiredFields(page);
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();
});

// Self-contained: creates a fresh Presentation record with a unique title, then
// opens that exact record and edits it.
test('edit existing conference presentation contribution', async ({ page }) => {
  const originalTitle = `conference-presentation-${Date.now()}`;
  const updatedTitle = `conference-presentation-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  // create the record this test will edit
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Conference');
  await contributionsPage.selectSubcategory('Presentation in Conference (OFFLINE)');
  await contributionsPage.fillTitle(originalTitle);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await fillConferenceRequiredFields(page);
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();

  // open that exact record and edit it
  await contributionsPage.navigateToContributions();
  await contributionsPage.openRowForEdit(originalTitle);
  await contributionsPage.fillTitle(updatedTitle);
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

test('conference presentation — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `conference-presentation-future-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Conference');
  await contributionsPage.selectSubcategory('Presentation in Conference (OFFLINE)');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await fillConferenceRequiredFields(page);
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('conference presentation — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `conference-presentation-prevq-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Conference');
  await contributionsPage.selectSubcategory('Presentation in Conference (OFFLINE)');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await fillConferenceRequiredFields(page);
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
