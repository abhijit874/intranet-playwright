import { test, expect } from '@playwright/test';
import path from 'path';
import { CompanyPage } from '../pages/CompanyPage';

test('add new company', async ({ page }) => {
  const invoiceCode = `I${Date.now().toString().slice(-2)}`;
  const fixturePath = path.join(__dirname, '../../fixtures/image.png');

  const companyPage = new CompanyPage(page);
  await companyPage.loginAs('hr');
  await companyPage.navigateTo();
  await companyPage.clickAddCompany();

  await companyPage.selectJoshEntity('Josh India');
  await companyPage.fillName('openAI');
  await companyPage.setActive(true);
  await companyPage.fillGstNo('27ABCDE1234F1Z5');
  await companyPage.fillInvoiceCode(invoiceCode);
  await companyPage.fillWebsite('https://openai.com');
  await companyPage.checkBillingLocationUs();
  await companyPage.selectTimeZone('(GMT-10:00) Hawaii');
  await companyPage.selectBillingCurrency('USD');
  await companyPage.fillSalesManager('Saurabh Gaji');
  await companyPage.checkExistingManager();
  await companyPage.uploadLogo(fixturePath);
  await companyPage.uploadGstCard(fixturePath);
  await companyPage.uploadPanCard(fixturePath);
  await companyPage.uploadTanCard(fixturePath);
  await companyPage.fillTypeOfAddress('primary');
  await companyPage.fillAddress('350 Fifth Avenue, New York, NY 10118');
  await companyPage.fillCity('New York');
  await companyPage.fillState('New York');
  await companyPage.fillCountry('USA');
  await companyPage.fillLandline('1234567890');
  await companyPage.fillPinCode('123456');
  await companyPage.submit();

  await expect(page).toHaveURL(/\/companies/i);
});
