import { test } from '@playwright/test';
import { VendorPage } from '../pages/VendorPage';

test('add document in vendor', async ({ page }) => {
  const vendorCompany = 'open AI';

  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();
  await vendorPage.searchVendor(vendorCompany);
  await vendorPage.clickAddDocumentIcon(vendorCompany);
  await vendorPage.fillDocumentFromDate('2026-04-29');
  await vendorPage.fillDocumentToDate('2026-12-31');
  await vendorPage.selectDocumentType('PO');
  await vendorPage.uploadDocumentFile('tests/fixtures/image.png');
  await vendorPage.submitDocument();
});
