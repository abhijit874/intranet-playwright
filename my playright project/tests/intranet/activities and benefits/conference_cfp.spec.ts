import { test, expect } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { loginAsContributorFor } from './contributor_helpers';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

// Fills the CFP-specific required fields (Conference name, Location, CFP
// description, CFP status) that the subcategory form mandates.
async function fillCfpRequiredFields(page: import('@playwright/test').Page) {
  await page.getByLabel('Conference name *').fill('Tech Conference');
  await page.getByLabel('Location *').fill('Pune');
  await page.getByLabel('CFP description *').fill('CFP submission for a talk');
  await page.getByLabel('CFP status *').fill('Submitted');
}

test('submit conference CFP contribution', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J7', 'Conference', 'CFP');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Conference');
  await contributionsPage.selectSubcategory('CFP');
  await contributionsPage.fillTitle('Claude');
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await fillCfpRequiredFields(page);
  await contributionsPage.submitContribution();
  const alert = page.locator('#flashes');
  await expect(alert).toBeVisible();
  await expect(alert).toHaveClass(/alert-info/);
  await expect(alert).toContainText('Contribution saved successfully');
});

// Self-contained: creates a fresh CFP record with a unique title, then opens that
// exact record and edits it. No dependency on pre-existing data or other tests.
test('edit existing conference cfp contribution', async ({ page }) => {
  const originalTitle = `conference-cfp-${Date.now()}`;
  const updatedTitle = `conference-cfp-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J7', 'Conference', 'CFP');

  // create the record this test will edit
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Conference');
  await contributionsPage.selectSubcategory('CFP');
  await contributionsPage.fillTitle(originalTitle);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await fillCfpRequiredFields(page);
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

test('conference CFP — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `conference-cfp-future-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J7', 'Conference', 'CFP');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Conference');
  await contributionsPage.selectSubcategory('CFP');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await fillCfpRequiredFields(page);
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('conference CFP — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `conference-cfp-prevq-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J7', 'Conference', 'CFP');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Conference');
  await contributionsPage.selectSubcategory('CFP');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await fillCfpRequiredFields(page);
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
