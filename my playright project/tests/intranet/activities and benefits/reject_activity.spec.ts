import { test } from '@playwright/test';
import { ContributionsApprovalPage } from '../pages/activities/ContributionsApprovalPage';

test('reject activity', async ({ page }) => {
  const approvalPage = new ContributionsApprovalPage(page);
  await approvalPage.loginAs('hr');
  await approvalPage.navigateToContributionsApproval();
  await approvalPage.rejectContribution({
    title: 'claude',
    date: '11/05/2026',
    employeeName: 'Abhijit Kasbe',
    category: 'Blog Writing',
    subcategory: 'Self',
  });
});
