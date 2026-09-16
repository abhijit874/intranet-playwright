import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { loginAsContributorFor } from './contributor_helpers';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

/**
 * Registered Volunteers -> Josh Events.
 *
 * The only subcategory under the Registered Volunteers category, and the whole
 * category was previously untested.
 *
 * Grade rule: Josh Events is restricted to J10 and J11 (see contributor_helpers),
 * so the contributor is picked from J11 rather than the J9 used by most of the
 * public-speaking specs.
 *
 * The form is the simplest of any subcategory: title and activity date only, no
 * body fields and no attachment.
 */
const CATEGORY = 'Registered Volunteers';
const SUBCATEGORY = 'Josh Events';
const GRADE = 'J11';

test('registered volunteers josh events contribution', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, GRADE, CATEGORY, SUBCATEGORY);
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory(CATEGORY);
  await contributionsPage.selectSubcategory(SUBCATEGORY);
  await contributionsPage.fillTitle(`josh-events-${Date.now()}`);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();
});

// Self-contained: creates a fresh record with a unique title, then opens that
// exact record and edits it.
test('edit existing registered volunteers josh events contribution', async ({ page }) => {
  const originalTitle = `josh-events-${Date.now()}`;
  const updatedTitle = `josh-events-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, GRADE, CATEGORY, SUBCATEGORY);

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory(CATEGORY);
  await contributionsPage.selectSubcategory(SUBCATEGORY);
  await contributionsPage.fillTitle(originalTitle);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();

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
// the test fails — which is why these carry test.fail(): they pass by failing,
// so the suite stays green while the defect is open. If activity-date validation
// is ever added, Playwright reports them as "unexpectedly passed" — that is the
// signal to delete the annotation.
const FUTURE_DATE = '2026-12-11'; // a future date the app must reject

test.fail('josh events — future date is rejected by the server', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, GRADE, CATEGORY, SUBCATEGORY);

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory(CATEGORY);
  await contributionsPage.selectSubcategory(SUBCATEGORY);
  await contributionsPage.fillTitle(`josh-events-future-${Date.now()}`);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test.fail('josh events — previous-quarter date is rejected by the server', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, GRADE, CATEGORY, SUBCATEGORY);

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory(CATEGORY);
  await contributionsPage.selectSubcategory(SUBCATEGORY);
  await contributionsPage.fillTitle(`josh-events-prevq-${Date.now()}`);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
