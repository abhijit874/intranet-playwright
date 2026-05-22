import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';

test('approve deallocation request', async ({ page }) => {
  const allocationPage = new AllocationRequestPage(page);
  await allocationPage.loginAs('hr');
  await allocationPage.navigateTo();
  await allocationPage.searchRequests('Aditya Kumar');
  await allocationPage.clickViewOnRow('Aditya Kumar', 'deallocation');
  await allocationPage.approveRequest(true);
});
