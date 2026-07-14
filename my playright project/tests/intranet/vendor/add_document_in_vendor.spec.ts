import { test } from '@playwright/test';
import { VendorDocumentPage } from '../pages/VendorDocumentPage';

test('add document in vendor', async ({ page }) => {
  const vendorCompany = 'open AI';

  const vendorDocumentPage = new VendorDocumentPage(page);
  await vendorDocumentPage.loginAs('hr');
  await vendorDocumentPage.navigateTo();
  await vendorDocumentPage.searchVendor(vendorCompany);
  await vendorDocumentPage.clickAddDocumentIcon(vendorCompany);
  await vendorDocumentPage.fillDocumentFromDate('2026-04-29');
  await vendorDocumentPage.fillDocumentToDate('2026-12-31');
  await vendorDocumentPage.selectDocumentType('PO');
  await vendorDocumentPage.uploadDocumentFile('tests/fixtures/image.png');
  await vendorDocumentPage.submitDocument();
});
