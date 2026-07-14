import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

test('open source contribution', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Open Source Contribution');
  await contributionsPage.selectSubcategory('Open Source');
  await contributionsPage.fillTitle('playwright automation');
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await contributionsPage.fillFieldByLabel('Repository handle (URL) *', 'https://codex.com');
  await contributionsPage.fillFieldByLabel('PR link *', 'https://chatgpt.com');
  await contributionsPage.fillFieldByLabel('Repository name *', 'AI automation');
  await contributionsPage.fillFieldByLabel('Library URL *', 'https://opencode.com');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();
});

// Self-contained: creates a fresh Open Source record with a unique title, then
// opens that exact record and edits it.
test('edit existing open source contribution', async ({ page }) => {
  const originalTitle = `open-source-${Date.now()}`;
  const updatedTitle = `open-source-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  // create the record this test will edit
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Open Source Contribution');
  await contributionsPage.selectSubcategory('Open Source');
  await contributionsPage.fillTitle(originalTitle);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await contributionsPage.fillFieldByLabel('Repository handle (URL) *', 'https://codex.com');
  await contributionsPage.fillFieldByLabel('PR link *', 'https://chatgpt.com');
  await contributionsPage.fillFieldByLabel('Repository name *', 'AI automation');
  await contributionsPage.fillFieldByLabel('Library URL *', 'https://opencode.com');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();

  // open that exact record and edit it
  await contributionsPage.navigateToContributions();
  await contributionsPage.openRowForEdit(originalTitle);
  await contributionsPage.fillTitle(updatedTitle);
  await contributionsPage.fillFieldByLabel('Repository name *', 'AI automation edited');
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

test('open source — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `open-source-future-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Open Source Contribution');
  await contributionsPage.selectSubcategory('Open Source');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await contributionsPage.fillFieldByLabel('Repository handle (URL) *', `https://codex.com/${stamp}`);
  await contributionsPage.fillFieldByLabel('PR link *', `https://chatgpt.com/${stamp}`);
  await contributionsPage.fillFieldByLabel('Repository name *', 'AI automation');
  await contributionsPage.fillFieldByLabel('Library URL *', `https://opencode.com/${stamp}`);
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('open source — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `open-source-prevq-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Open Source Contribution');
  await contributionsPage.selectSubcategory('Open Source');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await contributionsPage.fillFieldByLabel('Repository handle (URL) *', `https://codex.com/${stamp}`);
  await contributionsPage.fillFieldByLabel('PR link *', `https://chatgpt.com/${stamp}`);
  await contributionsPage.fillFieldByLabel('Repository name *', 'AI automation');
  await contributionsPage.fillFieldByLabel('Library URL *', `https://opencode.com/${stamp}`);
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
