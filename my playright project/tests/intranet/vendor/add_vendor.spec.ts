import { test, expect } from '@playwright/test';
import path from 'path';
import { VendorPage } from '../pages/VendorPage';

test('add new vendor', async ({ page }) => {
  const vendorCompany = 'open AI';
  const vendorCategory = 'AI';
  const uniqueNumber = Date.now().toString().slice(-4);
  const vendorPan = `ABCDE${uniqueNumber}F`;
  const vendorGstNumber = `27${vendorPan}1Z5`;
  const vendorCode = `playwright-${Date.now()}`;
  const fixturePath = path.join(__dirname, '../../fixtures/image.png');

  const vendorPage = new VendorPage(page);
  await vendorPage.loginAs('hr');
  await vendorPage.navigateTo();
  await vendorPage.clickAddVendor();

  await vendorPage.fillCompany(vendorCompany);
  await vendorPage.fillCategory(vendorCategory);
  await vendorPage.fillContractStartDate('2026-05-10');
  await vendorPage.fillContractEndDate('2026-12-31');
  await vendorPage.fillGstNumber(vendorGstNumber);
  await vendorPage.uploadGstFile(fixturePath);
  await vendorPage.fillPanNumber(vendorPan);
  await vendorPage.uploadPanCard(fixturePath);
  await vendorPage.fillMsmeNumber('MSME-AUTO-12345');
  await vendorPage.uploadMsmeCertificate(fixturePath);
  await vendorPage.fillVendorCode(vendorCode);
  await vendorPage.fillContactPersonName('john doe');
  await vendorPage.fillContactPersonRole('CEO');
  await vendorPage.fillContactPersonPhone('1234567890');
  await vendorPage.fillContactPersonEmail('johndoe@gmail.com');
  await vendorPage.fillBankAccountHolderName('jhon doe');
  await vendorPage.fillBankName('HDFC bank');
  await vendorPage.fillAccountNumber('50100123456789');
  await vendorPage.fillIfscCode('HDFC0001234');
  await vendorPage.uploadBankDocument(fixturePath);
  await vendorPage.fillAddress('123 Automation Street, Pune, Maharashtra');
  await vendorPage.fillCity('Pune');
  await vendorPage.fillPinCode('123456');
  await vendorPage.fillState('Maharashtra');
  await vendorPage.fillCountry('India');
  await vendorPage.fillLandline('1234567890');
  await vendorPage.submit();

  await vendorPage.navigateTo();
  await vendorPage.searchVendor(vendorCompany);
  const row = await vendorPage.findVendorRow(vendorCompany);
  await expect(row).toContainText(vendorCategory);
});
