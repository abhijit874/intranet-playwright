import { test } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';

test('mandatory fields - asset allocation must not be saved without required data', async ({ page }) => {
  const assetAllocationPage = new AssetAllocationPage(page);
  await assetAllocationPage.loginAs('admin');
  await assetAllocationPage.navigateTo();
  await assetAllocationPage.clickAddAssetAllocation();
  // Submit without filling any required fields
  await assetAllocationPage.submit();
  // If the allocation is saved successfully, validation was bypassed — fail the test
  await assetAllocationPage.assertNotAllocated();
});
