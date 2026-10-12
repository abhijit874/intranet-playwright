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
// Edits an existing allocation rather than creating one each run: opens the first
// allocation in the list and changes its purpose. Staging-only data, and editing
// (not creating/approving) sends no allocation mail.
test('editing allocation', async ({ page }) => {
  const updatedPurpose = `playwright edited ${Date.now().toString().slice(-6)}`;

  const allocationPage = new AssetAllocationPage(page);
  await allocationPage.loginAs('hr');
  await allocationPage.navigateTo();

  await allocationPage.clickEditOnFirstRow();
  await page.locator('#asset_allocation_purpose').clear();
  await page.locator('#asset_allocation_purpose').fill(updatedPurpose);
  await expect(page.locator('#asset_allocation_purpose')).toHaveValue(updatedPurpose);
  await allocationPage.submit();
  await allocationPage.verifyUpdateSuccessAlert();
});
