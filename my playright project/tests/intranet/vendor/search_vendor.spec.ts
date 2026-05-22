import { test, expect } from '@playwright/test';
import { VendorPage } from '../pages/VendorPage';

test('search vendor by name', async ({ page }) => {
  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();
  await vendorPage.searchVendor('alibaba');
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
