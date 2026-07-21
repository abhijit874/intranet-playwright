import { test, expect } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { loginAsContributorFor } from './contributor_helpers';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

test('open source development jem', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J10', 'Open Source Contribution', 'Develop new Gem / library');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Open Source Contribution');
  await contributionsPage.selectSubcategory('Develop new Gem / library');
  await contributionsPage.fillTitle('open AI');
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await contributionsPage.fillFieldByLabel('Library/Gem Name *', 'chat gpt');
  await contributionsPage.fillFieldByLabel('Library/Gem URL *', 'https://openai.com');
  await contributionsPage.fillFieldByLabel('Repository Link *', 'https://openai.com');
  await contributionsPage.fillFieldByLabel('Pull Request Link *', 'https://codex.com');
  await contributionsPage.fillFieldByLabel('Description *', 'playright automation');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();
});

// Self-contained: creates a fresh Develop-new-Gem record with a unique title, then
// opens that exact record and edits it.
test('edit existing open source gem contribution', async ({ page }) => {
  const originalTitle = `open-source-gem-${Date.now()}`;
  const updatedTitle = `open-source-gem-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J10', 'Open Source Contribution', 'Develop new Gem / library');

  // create the record this test will edit
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Open Source Contribution');
  await contributionsPage.selectSubcategory('Develop new Gem / library');
  await contributionsPage.fillTitle(originalTitle);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await contributionsPage.fillFieldByLabel('Library/Gem Name *', 'chat gpt');
  await contributionsPage.fillFieldByLabel('Library/Gem URL *', 'https://openai.com');
  await contributionsPage.fillFieldByLabel('Repository Link *', 'https://openai.com');
  await contributionsPage.fillFieldByLabel('Pull Request Link *', 'https://codex.com');
  await contributionsPage.fillFieldByLabel('Description *', 'playright automation');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();

  // open that exact record and edit it
  await contributionsPage.navigateToContributions();
  await contributionsPage.openRowForEdit(originalTitle);
  await contributionsPage.fillTitle(updatedTitle);
  await contributionsPage.fillFieldByLabel('Description *', 'edited playwright automation');
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

test('open source gem — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `open-source-gem-future-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J10', 'Open Source Contribution', 'Develop new Gem / library');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Open Source Contribution');
  await contributionsPage.selectSubcategory('Develop new Gem / library');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await contributionsPage.fillFieldByLabel('Library/Gem Name *', 'chat gpt');
  await contributionsPage.fillFieldByLabel('Library/Gem URL *', `https://openai.com/${stamp}`);
  await contributionsPage.fillFieldByLabel('Repository Link *', `https://openai.com/repo-${stamp}`);
  await contributionsPage.fillFieldByLabel('Pull Request Link *', `https://codex.com/${stamp}`);
  await contributionsPage.fillFieldByLabel('Description *', 'playright automation');
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('open source gem — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `open-source-gem-prevq-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J10', 'Open Source Contribution', 'Develop new Gem / library');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Open Source Contribution');
  await contributionsPage.selectSubcategory('Develop new Gem / library');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await contributionsPage.fillFieldByLabel('Library/Gem Name *', 'chat gpt');
  await contributionsPage.fillFieldByLabel('Library/Gem URL *', `https://openai.com/${stamp}`);
  await contributionsPage.fillFieldByLabel('Repository Link *', `https://openai.com/repo-${stamp}`);
  await contributionsPage.fillFieldByLabel('Pull Request Link *', `https://codex.com/${stamp}`);
  await contributionsPage.fillFieldByLabel('Description *', 'playright automation');
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
