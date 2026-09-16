import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { loginAsContributorFor } from './contributor_helpers';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

/**
 * Public Speaking -> Talk at College.
 *
 * Grade rule: Public Speaking is open to J7..J11, so any eligible contributor
 * will do. The form asks for three body fields on top of the usual title and
 * activity date: College name, Location and No of attendees. There is no
 * attachment on this subcategory, unlike Meetup.
 */
const CATEGORY = 'Public Speaking';
const SUBCATEGORY = 'Talk at College';

async function fillTalkAtCollegeFields(cp: ContributionsPage, attendees = '60') {
  await cp.fillFieldByLabel('College name *', 'COEP Pune');
  await cp.fillFieldByLabel('Location *', 'Pune');
  await cp.fillFieldByLabel('No of attendees *', attendees);
}

test('public speaking talk at college contribution', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J9', CATEGORY, SUBCATEGORY);
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory(CATEGORY);
  await contributionsPage.selectSubcategory(SUBCATEGORY);
  await contributionsPage.fillTitle(`talk-at-college-${Date.now()}`);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await fillTalkAtCollegeFields(contributionsPage);
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();
});

// Self-contained: creates a fresh record with a unique title, then opens that
// exact record and edits it.
test('edit existing public speaking talk at college contribution', async ({ page }) => {
  const originalTitle = `talk-at-college-${Date.now()}`;
  const updatedTitle = `talk-at-college-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J9', CATEGORY, SUBCATEGORY);

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory(CATEGORY);
  await contributionsPage.selectSubcategory(SUBCATEGORY);
  await contributionsPage.fillTitle(originalTitle);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await fillTalkAtCollegeFields(contributionsPage);
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();

  await contributionsPage.navigateToContributions();
  await contributionsPage.openRowForEdit(originalTitle);
  await contributionsPage.fillTitle(updatedTitle);
  await contributionsPage.fillFieldByLabel('No of attendees *', '85');
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

test.fail('talk at college — future date is rejected by the server', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J9', CATEGORY, SUBCATEGORY);

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory(CATEGORY);
  await contributionsPage.selectSubcategory(SUBCATEGORY);
  await contributionsPage.fillTitle(`talk-at-college-future-${Date.now()}`);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await fillTalkAtCollegeFields(contributionsPage);
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test.fail('talk at college — previous-quarter date is rejected by the server', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J9', CATEGORY, SUBCATEGORY);

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory(CATEGORY);
  await contributionsPage.selectSubcategory(SUBCATEGORY);
  await contributionsPage.fillTitle(`talk-at-college-prevq-${Date.now()}`);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await fillTalkAtCollegeFields(contributionsPage);
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
