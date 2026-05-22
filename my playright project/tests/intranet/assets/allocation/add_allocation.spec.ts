import { test } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';

test('adding new allocation', async ({ page }) => {
  const assetAllocPage = new AssetAllocationPage(page);
  await assetAllocPage.loginAs('hr');
  await assetAllocPage.navigateTo();
  await assetAllocPage.clickAddAssetAllocation();

  await assetAllocPage.selectAsset('DELL LATITUDE 3510 (12MZS93)');
  await assetAllocPage.selectUser('Abhijit Kasbe(abhijit.kasbe@joshsoftware.com)');
  await assetAllocPage.selectAllocatedFrom('Pune');
  await assetAllocPage.fillPurpose('playwright automation');
  await assetAllocPage.fillIssuedDate('2026-05-10');
  await assetAllocPage.submit();
});
