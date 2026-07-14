import { test } from '@playwright/test';
import { AllocationRequestApprovalPage } from '../pages/AllocationRequestApprovalPage';

test('approve deallocation request', async ({ page }) => {
  const approvalPage = new AllocationRequestApprovalPage(page);
  await approvalPage.loginAs('hr');
  await approvalPage.navigateTo();
  await approvalPage.searchRequests('Aditya Kumar');
  await approvalPage.clickViewOnRow('Aditya Kumar', 'deallocation');
  await approvalPage.approveRequest(true);
  await approvalPage.assertRequestApproved();
});
