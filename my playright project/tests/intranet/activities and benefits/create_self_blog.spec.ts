import { test, expect } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

// Master happy-flow test: creates a single self blog contribution and confirms it saves.
test('create self blog — happy flow', async ({ page }) => {
  const blogUrl = `https://uri.com-${Date.now()}`;
  const activityDate = validCurrentQuarterDate();

  const cp = new ContributionsPage(page);
  await cp.loginAs('employee');

  await cp.navigateToContributions();
  await cp.clickAddContribution();
  await cp.selectCategory('Blog Writing');
  await cp.fillTitle('fresh test');
  await cp.fillDate(activityDate);
  await cp.fillFieldByLabel('Blog URL *', blogUrl);
  await page.locator('#published_on').selectOption('Self');
  await cp.submitContribution();
  await cp.assertSaved();
});

// Self-contained: creates a record with a fresh URL, then submits the same URL
// again and expects the app to reject the duplicate.
test('create self blog — duplicate URL is rejected', async ({ page }) => {
  const blogUrl = `https://uri.com-${Date.now()}`;
  const activityDate = validCurrentQuarterDate();

  const cp = new ContributionsPage(page);
  await cp.loginAs('employee');

  // first submission — creates the record
  await cp.navigateToContributions();
  await cp.clickAddContribution();
  await cp.selectCategory('Blog Writing');
  await cp.fillTitle('playwright-self-blog-original');
  await cp.fillDate(activityDate);
  await cp.fillFieldByLabel('Blog URL *', blogUrl);
  await page.locator('#published_on').selectOption('Self');
  await cp.submitContribution();
  await cp.assertSaved();

  // second submission with the same URL — must be rejected
  await cp.navigateToContributions();
  await cp.clickAddContribution();
  await cp.selectCategory('Blog Writing');
  await cp.fillTitle('playwright-self-blog-dup');
  await cp.fillDate(activityDate);
  await cp.fillFieldByLabel('Blog URL *', blogUrl);
  await page.locator('#published_on').selectOption('Self');
  await cp.submitContribution();
  const dupAlert = page.locator('#flashes');
  await expect(dupAlert).toBeVisible();
  await expect(dupAlert).toContainText("You've already submitted a blog with this URL.");
});

// SERVER-SIDE validation check.
// forceActivityDate() sets the date via JS, bypassing the browser's client-side
// validation (the same way a malicious user or direct API call would). The
// backend MUST still reject a future date. submitAndAssertRejected() inspects the
// create POST's response: a 3xx redirect means a record was actually created, so
// the test fails — that failure is the bug being tracked.
const FUTURE_DATE = '2026-12-11'; // a future date the app must reject

test('create self blog — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `playwright-self-blog-future-${stamp}`; // unique per run, avoids collisions
  const blogUrl = `https://nourl.com-future-${stamp}`;

  const cp = new ContributionsPage(page);
  await cp.loginAs('employee');

  await cp.navigateToContributions();
  await cp.clickAddContribution();
  await cp.selectCategory('Blog Writing');
  await cp.fillTitle(title);
  await cp.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await cp.fillFieldByLabel('Blog URL *', blogUrl);
  await page.locator('#published_on').selectOption('Self');
  await cp.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('create self blog — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `playwright-self-blog-prevq-${stamp}`; // unique per run, avoids collisions
  const blogUrl = `https://nourl.com-prevq-${stamp}`;

  const cp = new ContributionsPage(page);
  await cp.loginAs('employee');

  await cp.navigateToContributions();
  await cp.clickAddContribution();
  await cp.selectCategory('Blog Writing');
  await cp.fillTitle(title);
  await cp.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await cp.fillFieldByLabel('Blog URL *', blogUrl);
  await page.locator('#published_on').selectOption('Self');
  await cp.submitAndAssertRejected('previous-quarter Activity Date');
});

// Self-contained: first creates a fresh self-blog record, then opens that exact
// record by its unique title, edits the title and URL, and confirms the update.
test('edit existing self blog contribution', async ({ page }) => {
  const originalTitle = `playwright-self-blog-edit-${Date.now()}`;
  const updatedTitle = `playwright-self-edited-${Date.now()}`;
  const blogUrl = `https://uri.com-${Date.now()}`;
  const activityDate = validCurrentQuarterDate();

  const cp = new ContributionsPage(page);
  await cp.loginAs('employee');

  // create the record this test will edit
  await cp.navigateToContributions();
  await cp.clickAddContribution();
  await cp.selectCategory('Blog Writing');
  await cp.fillTitle(originalTitle);
  await cp.fillDate(activityDate);
  await cp.fillFieldByLabel('Blog URL *', blogUrl);
  await page.locator('#published_on').selectOption('Self');
  await cp.submitContribution();
  await cp.assertSaved();

  // open that exact record and edit it
  await cp.navigateToContributions();
  await cp.openRowForEdit(originalTitle);
  await cp.fillTitle(updatedTitle);
  await cp.fillFieldByLabel('Blog URL *', 'https://playwright.in/edited');
  await cp.submitEdit();
  await cp.assertUpdated();
});
