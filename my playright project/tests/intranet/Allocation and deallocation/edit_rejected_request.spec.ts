import { test } from '@playwright/test';
import { AllocationRequestApprovalPage } from '../pages/AllocationRequestApprovalPage';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';

test('edit rejected request', async ({ page }) => {
  const approvalPage = new AllocationRequestApprovalPage(page);
  const allocationPage = new AllocationRequestPage(page);
  await approvalPage.loginAs('admin');
  await approvalPage.navigateTo();
  await approvalPage.clickRejectedTab();
  await approvalPage.searchRequests('Abhay Inamdar');
  await approvalPage.clickEditIconOnRow('Abhay Inamdar');
  await allocationPage.selectBillingCode('BC_M_USD_02');
  await allocationPage.submit();
  await allocationPage.assertRequestCreated();
});
