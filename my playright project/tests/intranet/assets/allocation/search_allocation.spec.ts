import { test, expect } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';
import { createAllocation, uniquePurpose } from './allocation_helpers';

// Self-contained: creates an allocation, then searches for that exact record by
// the allocated asset's serial and confirms the row appears.
test('search asset allocation', async ({ page }) => {
  const allocationPage = new AssetAllocationPage(page);
  await allocationPage.loginAs('hr');
  await allocationPage.navigateTo();

  const serial = await createAllocation(allocationPage, { purpose: uniquePurpose('playwright search') });

  await allocationPage.navigateTo();
  await allocationPage.searchAllocation(serial);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
