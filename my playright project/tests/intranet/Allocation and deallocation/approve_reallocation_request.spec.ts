import { test } from '@playwright/test';
import { AllocationRequestApprovalPage } from '../pages/AllocationRequestApprovalPage';

test('approve reallocation request', async ({ page }) => {
  const approvalPage = new AllocationRequestApprovalPage(page);
  await approvalPage.loginAs('hr');
  await approvalPage.navigateTo();
  await approvalPage.searchRequests('Aditya Kumar');
  await approvalPage.clickViewOnRow('Aditya Kumar', 'allocation');
  await approvalPage.clickApproveButton();
  await approvalPage.assertRequestApproved();
});
