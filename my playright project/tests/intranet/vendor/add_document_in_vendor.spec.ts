import { test } from '@playwright/test';
import { VendorDocumentPage } from '../pages/VendorDocumentPage';
import { VendorPage } from '../pages/VendorPage';
import { createVendor } from './vendor_helpers';

// Self-contained: creates a fresh vendor, then uploads a document against that
// exact vendor. The document type is picked at random — any type is valid and
// none is asserted.
test('add document in vendor', async ({ page }) => {
  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();

  // create the vendor this test will attach a document to
  const { company } = await createVendor(vendorPage);

  const vendorDocumentPage = new VendorDocumentPage(page);
  await vendorDocumentPage.navigateTo();
  await vendorDocumentPage.searchVendor(company);
  await vendorDocumentPage.clickAddDocumentIcon(company);
  await vendorDocumentPage.fillDocumentFromDate('2026-04-29');
  await vendorDocumentPage.fillDocumentToDate('2026-12-31');
  await vendorDocumentPage.selectRandomDocumentType();
  await vendorDocumentPage.uploadDocumentFile('tests/fixtures/image.png');
  await vendorDocumentPage.submitDocument();
});
