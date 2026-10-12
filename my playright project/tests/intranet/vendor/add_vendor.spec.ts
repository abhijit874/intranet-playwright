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

// Edits an existing vendor rather than creating one each run: opens the first
// vendor already in the list, changes its contact-person role and saves. The
// data is staging-only, so mutating an existing record is fine and avoids adding
// a new vendor on every run.
test('edit existing vendor', async ({ page }) => {
  const updatedRole = `CTO ${Date.now().toString().slice(-4)}`;

  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();

  const company = await vendorPage.clickEditOnFirstRow();

  await vendorPage.fillContactPersonRole(updatedRole);
  await vendorPage.submit();
  await vendorPage.assertSaved();

  // The edit persisted: re-open the same vendor and confirm the new role stuck.
  await vendorPage.searchVendor(company);
  await vendorPage.clickEditOnRow(company);
  await expect(page.locator('#vendor_contact_persons_attributes_0_role')).toHaveValue(updatedRole);
});
