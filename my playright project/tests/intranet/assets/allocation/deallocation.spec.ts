import { test } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';

test('deallocation', async ({ page }) => {
  const allocationDate = '22/04/2026';

  const assetAllocPage = new AssetAllocationPage(page);
  await assetAllocPage.loginAs('hr');
  await assetAllocPage.navigateTo();
  await assetAllocPage.searchAllocation(allocationDate);
  await assetAllocPage.clickEditOnRow(allocationDate);
  await assetAllocPage.markAsReceived();
  await assetAllocPage.fillReceivedDate('2026-05-10');
  await assetAllocPage.submit();
});
