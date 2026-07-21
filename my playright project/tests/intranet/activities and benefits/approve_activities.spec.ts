import { test } from '@playwright/test';
import { ContributionsApprovalPage } from '../pages/activities/ContributionsApprovalPage';

// Opens the record's action modal and asserts whichever response the system
// gives: an eligible record is approved (happy flow); an over-quota record shows
// the "...exceed the allowed quota in this category." message and cannot be approved.
test('approve activity — eligible is approved, over-quota shows the message', async ({ page }) => {
  const approvalPage = new ContributionsApprovalPage(page);
  await approvalPage.loginAs('hr');
  await approvalPage.navigateToContributionsApproval();
  await approvalPage.approveContribution({
    title: 'open AI',
    date: '2026/07/14',
    employeeName: 'Abhijit Kasbe',
    category: 'Open Source Contribution',
    subcategory: 'Develop new Gem / library',
  });
});
