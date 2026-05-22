import { test } from '@playwright/test';
import { VendorPage } from '../pages/VendorPage';

test('edit existing vendor', async ({ page }) => {
  const vendorCompany = 'open AI';
  const updatedRole = `CTO ${Date.now().toString().slice(-4)}`;

  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();
  await vendorPage.searchVendor(vendorCompany);
  await vendorPage.clickEditOnRow(vendorCompany);

  await vendorPage.fillContactPersonRole(updatedRole);
  await vendorPage.submit();
});
