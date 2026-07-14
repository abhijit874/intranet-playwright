import { test } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { validCurrentQuarterDate } from '../utils/test_helpers';

// Self-contained: creates a fresh self-blog record with a unique title, then —
// exactly like the edit flow — searches the contributions table for that exact
// record, locates its delete icon (<i class="text-white ri-delete-bin-line">) and
// deletes it. The delete fires a native confirm() popup that is NOT part of the
// DOM (it can't be inspected/located); deleteContribution() accepts it ("OK")
// before the request goes out. Finally we confirm the record no longer exists.
test('delete contribution', async ({ page }) => {
  const title = `playwright-delete-${Date.now()}`; // unique, so the lookup is exact
  const blogUrl = `https://uri.com-${Date.now()}`;
  const activityDate = validCurrentQuarterDate();

  const cp = new ContributionsPage(page);
  await cp.loginAs('employee');

  // create the record this test will delete
  await cp.navigateToContributions();
  await cp.clickAddContribution();
  await cp.selectCategory('Blog Writing');
  await cp.fillTitle(title);
  await cp.fillDate(activityDate);
  await cp.fillFieldByLabel('Blog URL *', blogUrl);
  await page.locator('#published_on').selectOption('Self');
  await cp.submitContribution();
  await cp.assertSaved();

  // search the table for that exact record, delete it, then confirm it is gone
  await cp.navigateToContributions();
  await cp.deleteContribution(title);
  await cp.assertContributionDeleted(title);
});
