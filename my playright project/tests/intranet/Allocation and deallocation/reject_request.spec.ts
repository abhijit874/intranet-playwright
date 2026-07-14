import { test } from '@playwright/test';
import { AllocationRequestApprovalPage } from '../pages/AllocationRequestApprovalPage';

test('reject deallocation request', async ({ page }) => {
  const approvalPage = new AllocationRequestApprovalPage(page);
  await approvalPage.loginAs('hr');
  await approvalPage.navigateTo();
  await approvalPage.searchRequests('Balaji S V');
  await approvalPage.clickViewOnRow('Balaji S V', 'deallocation');
  await approvalPage.clickRejectButton();
  await approvalPage.fillRejectReason('this is test');
  await approvalPage.confirmReject();
  await approvalPage.assertRequestRejected();
});
