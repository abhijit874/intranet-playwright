import { test, expect } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';
import { createAllocation, uniquePurpose } from './allocation_helpers';

test('adding new allocation', async ({ page }) => {
  const allocationPage = new AssetAllocationPage(page);
  await allocationPage.loginAs('hr');
  await allocationPage.navigateTo();

  // createAllocation picks the first available asset and verifies the success alert.
  await createAllocation(allocationPage, { purpose: 'playwright automation' });
});

// Self-contained: creates a fresh allocation (on the first available asset) with a
// unique purpose, then searches for that exact record by the allocated asset's
// serial number and edits it.
test('editing allocation', async ({ page }) => {
  const purpose = uniquePurpose();
  const updatedPurpose = `${purpose} edited`;

  const allocationPage = new AssetAllocationPage(page);
  await allocationPage.loginAs('hr');
  await allocationPage.navigateTo();

  // create the allocation this test will edit
  const serial = await createAllocation(allocationPage, { purpose });

  // find the active allocation for that asset and edit its purpose
  await allocationPage.navigateTo();
  await allocationPage.searchAllocation(serial);
  await allocationPage.openActiveAllocationForEdit(serial);
  await page.locator('#asset_allocation_purpose').clear();
  await page.locator('#asset_allocation_purpose').fill(updatedPurpose);
  await expect(page.locator('#asset_allocation_purpose')).toHaveValue(updatedPurpose);
  await allocationPage.submit();
  await allocationPage.verifyUpdateSuccessAlert();
});
