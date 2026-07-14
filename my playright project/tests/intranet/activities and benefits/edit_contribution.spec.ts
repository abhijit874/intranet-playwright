import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';

// Data-driven edit test.
// Locates an EXISTING contribution by the parameters below, opens it, applies the
// supplied new values, and confirms the update. Every value comes from an
// environment variable, so the same test can target any record without code
// changes.
//
//   Locate the record (which row in the Contributions table to edit):
//     EDIT_USER            role to log in as: employee | hr | admin  (default: employee)
//     EDIT_TITLE           Title column        e.g. "Why I Traded My Comfort Zone..."
//     EDIT_CATEGORY        Category column     e.g. "Blog Writing"
//     EDIT_SUBCATEGORY     Subcategory column  e.g. "Self Blog"
//     EDIT_ACTIVITY_DATE   Activity Date as shown in the table, dd/mm/yyyy  e.g. "21/02/2026"
//
//   New values to apply (set at least one — only the ones provided are changed):
//     NEW_TITLE            new Title
//     NEW_BLOG_URL         new "Blog URL *"
//     NEW_ACTIVITY_DATE    new Activity Date for the date input, yyyy-mm-dd  e.g. "2026-02-20"
//     NEW_SUBCATEGORY      new Subcategory
//
// Example (PowerShell):
//   $env:EDIT_TITLE="Why I Traded My Comfort Zone for the New Labour Codes (And Why You Should Too)"
//   $env:EDIT_CATEGORY="Blog Writing"; $env:NEW_TITLE="Updated title"
//   $env:NEW_BLOG_URL="https://joshsoftware.com/updated"
//   npx playwright test "tests/intranet/activities and benefits/edit_contribution.spec.ts"

const role = (process.env.EDIT_USER ?? 'employee') as 'employee' | 'hr' | 'admin';

test('edit an existing contribution located by parameters', async ({ page }) => {
  // Parameters that identify which existing row to edit.
  const criteria = {
    title: process.env.EDIT_TITLE,
    category: process.env.EDIT_CATEGORY,
    subcategory: process.env.EDIT_SUBCATEGORY,
    activityDate: process.env.EDIT_ACTIVITY_DATE,
  };

  // The new values to write into the opened record.
  const newValues = {
    title: process.env.NEW_TITLE,
    blogUrl: process.env.NEW_BLOG_URL,
    activityDate: process.env.NEW_ACTIVITY_DATE,
    subcategory: process.env.NEW_SUBCATEGORY,
  };

  // Fail fast with a clear message when the run is missing required inputs.
  if (!Object.values(criteria).some(Boolean)) {
    throw new Error(
      'No locate parameters set. Provide at least one of ' +
      'EDIT_TITLE / EDIT_CATEGORY / EDIT_SUBCATEGORY / EDIT_ACTIVITY_DATE.'
    );
  }
  if (!Object.values(newValues).some(Boolean)) {
    throw new Error(
      'No new values set. Provide at least one of ' +
      'NEW_TITLE / NEW_BLOG_URL / NEW_ACTIVITY_DATE / NEW_SUBCATEGORY.'
    );
  }

  const cp = new ContributionsPage(page);
  await cp.loginAs(role);

  // Find the existing record by the supplied criteria and open its edit form.
  await cp.navigateToContributions();
  await cp.openContributionForEditByCriteria(criteria);

  // Apply only the new values that were provided.
  if (newValues.subcategory) await cp.selectSubcategory(newValues.subcategory);
  if (newValues.title) await cp.fillTitle(newValues.title);
  if (newValues.activityDate) await cp.fillDate(newValues.activityDate);
  if (newValues.blogUrl) await cp.fillFieldByLabel('Blog URL *', newValues.blogUrl);

  await cp.submitEdit();
  await cp.assertUpdated();
});
