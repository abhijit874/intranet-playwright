import { test, expect } from '@playwright/test';
import { ContributionsApprovalPage } from '../pages/activities/ContributionsApprovalPage';

// Rejects whichever contribution is first in the pending queue. It used to name a
// fixed record ("claude" by Abhijit Kasbe, 11/05/2026), which stopped existing —
// records leave Pending once actioned, and at quarter end they move to Frozen.
test('reject activity', async ({ page }) => {
  const approvalPage = new ContributionsApprovalPage(page);
  await approvalPage.loginAs('hr');
  await approvalPage.navigateToContributionsApproval();

  const rejected = await approvalPage.rejectFirstPending();
  test.skip(rejected === null, 'approval queue is empty - nothing pending to reject');

  await expect(page.locator('#flashes')).toContainText(/reject/i, { timeout: 15000 });
});
