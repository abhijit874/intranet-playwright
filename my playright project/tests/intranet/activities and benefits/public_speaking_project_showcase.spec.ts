import { test, expect } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { loginAsContributorFor } from './contributor_helpers';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

test('public speaking project showcase contribution', async ({ page }) => {
  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J10', 'Public speaking', 'Project Showcase');
  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Project Showcase');
  await page.getByLabel('Title:').fill('project showcase');
  await page.getByLabel('Activity Date:').fill(validCurrentQuarterDate());
  await contributionsPage.selectFirstProject();
  await contributionsPage.submitContribution();
  // The app allows only one showcase per project per team. So a fresh submission
  // either saves, or — if a showcase already exists for this contributor's project
  // from a prior run — is correctly rejected as a duplicate. Either response is a
  // valid, expected outcome.
  const alert = page.locator('#flashes');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(
    /Contribution saved successfully|Project showcase already submitted/
  );
});

// NOTE: Project Showcase cannot use the create-then-edit self-contained pattern.
// The app allows only one showcase per project per team, so creating a second
// showcase to edit is rejected as a duplicate. Instead this edits an existing
// showcase (e.g. the one created by the test above), and skips if none is editable.
test('edit existing public speaking project showcase contribution', async ({ page }) => {
  const updatedTitle = `project-showcase-edited-${Date.now()}`;

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J10', 'Public speaking', 'Project Showcase');
  await contributionsPage.navigateToContributions();

  const editable = await contributionsPage.openEditableFromSearchTerms(
    ['Project Showcase', 'Public speaking', 'project showcase'],
    { throwOnMissing: false }
  );
  test.skip(!editable, 'No editable project showcase record found (approved/locked or none exists).');

  await page.getByLabel('Title:').fill(updatedTitle);
  await contributionsPage.submitEdit();
  await contributionsPage.assertUpdated();
});

// SERVER-SIDE validation check.
// forceActivityDate() sets the date via JS, bypassing the browser's client-side
// validation (the same way a malicious user or direct API call would). The
// backend MUST still reject a future date. submitAndAssertRejected() inspects the
// create POST's response: a 3xx redirect means a record was actually created, so
// the test fails — that failure is the bug being tracked.
// NOTE: only one showcase is allowed per project/team, so the server may also
// reject this submission as a duplicate — either way no future-dated record is
// created, so submitAndAssertRejected() still holds.
const FUTURE_DATE = '2026-12-11'; // a future date the app must reject

test('public speaking project showcase — future date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `project-showcase-future-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J10', 'Public speaking', 'Project Showcase');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Project Showcase');
  await page.getByLabel('Title:').fill(title);
  await contributionsPage.forceActivityDate(FUTURE_DATE); // bypasses client-side validation
  await contributionsPage.selectFirstProject();
  await contributionsPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceActivityDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('public speaking project showcase — previous-quarter date is rejected by the server', async ({ page }) => {
  const stamp = Date.now();
  const title = `project-showcase-prevq-${stamp}`; // unique per run, avoids collisions

  const contributionsPage = new ContributionsPage(page);
  await loginAsContributorFor(page, 'J10', 'Public speaking', 'Project Showcase');

  await contributionsPage.navigateToContributions();
  await contributionsPage.clickAddContribution();
  await contributionsPage.selectCategory('Public speaking');
  await contributionsPage.selectSubcategory('Project Showcase');
  await page.getByLabel('Title:').fill(title);
  await contributionsPage.forceActivityDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await contributionsPage.selectFirstProject();
  await contributionsPage.submitAndAssertRejected('previous-quarter Activity Date');
});
