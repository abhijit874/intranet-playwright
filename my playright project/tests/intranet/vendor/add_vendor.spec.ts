import { test, expect } from '@playwright/test';
import { VendorPage } from '../pages/VendorPage';
import { createVendor } from './vendor_helpers';

// Creates a vendor with a unique company name and confirms it shows up in the
// list with the category it was created with.
test('add new vendor', async ({ page }) => {
  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();

  const { company, category } = await createVendor(vendorPage);

  await vendorPage.navigateTo();
  await vendorPage.searchVendor(company);
  const row = await vendorPage.findVendorRow(company);
  await expect(row).toContainText(category);
});

// Self-contained: creates a fresh vendor, then finds that exact vendor and edits
// it — no dependency on a pre-seeded record.
test('edit existing vendor', async ({ page }) => {
  const updatedRole = `CTO ${Date.now().toString().slice(-4)}`;

  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();

  // create the vendor this test will edit
  const { company } = await createVendor(vendorPage);

  await vendorPage.navigateTo();
  await vendorPage.searchVendor(company);
  await vendorPage.clickEditOnRow(company);

  await vendorPage.fillContactPersonRole(updatedRole);
  await vendorPage.submit();

  // the edited vendor should still be listed
  await vendorPage.navigateTo();
  await vendorPage.searchVendor(company);
  await expect(await vendorPage.findVendorRow(company)).toBeVisible();
});
