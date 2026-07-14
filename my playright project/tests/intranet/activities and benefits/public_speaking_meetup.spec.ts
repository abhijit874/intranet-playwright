import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

test('public speaking meetup contribution', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Meetup');
  await contributionsPage.fillTitle('codex open AI');
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await contributionsPage.fillFieldByLabel('Location *', 'Pune');
  await contributionsPage.fillFieldByLabel('Meetup Type *', 'offline');
  await page.getByLabel('Number of Attendees *').fill('50');
  await contributionsPage.attachFile('#attachment', 'tests/fixtures/image.png');
  await contributionsPage.fillFieldByLabel('URL *', 'https://openai.com');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();
});

// Self-contained: creates a fresh Meetup record with a unique title, then opens
// that exact record and edits it.
test('edit existing public speaking meetup contribution', async ({ page }) => {
  const originalTitle = `meetup-${Date.now()}`;
  const updatedTitle = `meetup-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  // create the record this test will edit
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Meetup');
  await contributionsPage.fillTitle(originalTitle);
  await contributionsPage.fillDate(validCurrentQuarterDate());
  await contributionsPage.fillFieldByLabel('Location *', 'Pune');
  await contributionsPage.fillFieldByLabel('Meetup Type *', 'offline');
  await page.getByLabel('Number of Attendees *').fill('50');
  await contributionsPage.attachFile('#attachment', 'tests/fixtures/image.png');
  await contributionsPage.fillFieldByLabel('URL *', 'https://openai.com');
  await contributionsPage.submitContribution();
  await contributionsPage.assertSaved();

  // open that exact record and edit it (the attachment is required again on the
  // edit form, so re-attach it before submitting)
  await contributionsPage.navigateToContributions();
  await contributionsPage.openRowForEdit(originalTitle);
  await contributionsPage.fillTitle(updatedTitle);
  await page.getByLabel('Number of Attendees *').fill('75');
  await contributionsPage.attachFile('#attachment', 'tests/fixtures/image.png');
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

test('public speaking meetup — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `meetup-future-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Meetup');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await contributionsPage.fillFieldByLabel('Location *', 'Pune');
  await contributionsPage.fillFieldByLabel('Meetup Type *', 'offline');
  await page.getByLabel('Number of Attendees *').fill('50');
  await contributionsPage.attachFile('#attachment', 'tests/fixtures/image.png');
  await contributionsPage.fillFieldByLabel('URL *', `https://openai.com/${stamp}`);
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('public speaking meetup — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `meetup-prevq-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await contributionsPage.loginAs('employee');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Meetup');
  await contributionsPage.fillTitle(title);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await contributionsPage.fillFieldByLabel('Location *', 'Pune');
  await contributionsPage.fillFieldByLabel('Meetup Type *', 'offline');
  await page.getByLabel('Number of Attendees *').fill('50');
  await contributionsPage.attachFile('#attachment', 'tests/fixtures/image.png');
  await contributionsPage.fillFieldByLabel('URL *', `https://openai.com/${stamp}`);
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
