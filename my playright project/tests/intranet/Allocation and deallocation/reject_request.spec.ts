import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';

test('reject deallocation request', async ({ page }) => {
  const allocationPage = new AllocationRequestPage(page);
  await allocationPage.loginAs('hr');
  await allocationPage.navigateTo();
  await allocationPage.searchRequests('Balaji S V');
  await allocationPage.clickViewOnRow('Balaji S V', 'deallocation');
  await allocationPage.clickRejectButton();
  await allocationPage.fillRejectReason('this is test');
  await allocationPage.confirmReject();
  await allocationPage.assertRequestRejected();
});
