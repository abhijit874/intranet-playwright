import { test } from '@playwright/test';
import { AllocationRequestApprovalPage } from '../pages/AllocationRequestApprovalPage';

test('approve allocation request', async ({ page }) => {
  const approvalPage = new AllocationRequestApprovalPage(page);
  await approvalPage.loginAs('hr');
  await approvalPage.navigateTo();
  await approvalPage.searchRequests('Aditya Kumar');
  await approvalPage.clickViewOnRow('Aditya Kumar', 'allocation');
  await approvalPage.approveAllocationRequest();
  await approvalPage.assertRequestApproved();
});
