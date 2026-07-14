import { test } from '@playwright/test';
import { VendorPage } from '../pages/VendorPage';

test('mandatory fields - vendor must not be saved without required data', async ({ page }) => {
  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();
  await vendorPage.clickAddVendor();
  // Submit without filling any required fields
  await vendorPage.submit();
  // If the page navigates away from /vendors/new, validation was bypassed — fail the test
  await vendorPage.assertNotSaved();
});
