import { test } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';
import { createAllocation, uniquePurpose } from './allocation_helpers';

// Self-contained: creates a fresh allocation, then finds that exact record by the
// allocated asset's serial and deallocates it (marks the asset as received).
test('deallocation', async ({ page }) => {
  const allocationPage = new AssetAllocationPage(page);
  await allocationPage.loginAs('hr');
  await allocationPage.navigateTo();

  // create the allocation this test will deallocate
  const serial = await createAllocation(allocationPage, { purpose: uniquePurpose('playwright deallocation') });

  // find the active allocation for that asset and mark it as received
  await allocationPage.navigateTo();
  await allocationPage.searchAllocation(serial);
  await allocationPage.openActiveAllocationForEdit(serial);
  await allocationPage.markAsReceived();
  await allocationPage.fillReceivedDate('2026-05-10');
  await allocationPage.submit();
  await allocationPage.verifyUpdateSuccessAlert();
});
