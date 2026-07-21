import { test, expect } from '@playwright/test';
import { VendorPage } from '../pages/VendorPage';
import { createVendor } from './vendor_helpers';

// Self-contained: creates a vendor, then searches for that exact company name and
// confirms the row appears — rather than relying on a pre-seeded vendor.
test('search vendor by name', async ({ page }) => {
  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();

  const { company } = await createVendor(vendorPage);

  await vendorPage.navigateTo();
  await vendorPage.searchVendor(company);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await expect(await vendorPage.findVendorRow(company)).toContainText(company);
});
