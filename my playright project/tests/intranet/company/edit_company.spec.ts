import { test, expect } from '@playwright/test';
import { CompanyPage } from '../pages/CompanyPage';

test('edit company', async ({ page }) => {
  const randomSuffix = Date.now().toString().slice(-6);
  const updatedWebsite = `https://openai.com/${randomSuffix}`;
  const updatedAddress = `${randomSuffix} Market Street, San Francisco, CA`;
  const updatedLandline = `98${randomSuffix.slice(-8).padStart(8, '0')}`;
  const updatedPinCode = randomSuffix.slice(-6).padStart(6, '1');

  const companyPage = new CompanyPage(page);
  await companyPage.loginAs('hr');
  await companyPage.navigateTo();
  await companyPage.searchCompany('openAI');
  await companyPage.clickEditOnRow('openAI');

  await companyPage.fillWebsite(updatedWebsite);
  await companyPage.fillSalesManager(`Saurabh Gaji ${randomSuffix}`);
  await companyPage.fillTypeOfAddress(`primary ${randomSuffix}`);
  await companyPage.fillAddress(updatedAddress);
  await companyPage.fillCity(`San Francisco ${randomSuffix}`);
  await companyPage.fillState(`California ${randomSuffix}`);
  await companyPage.fillCountry('USA');
  await companyPage.fillLandline(updatedLandline);
  await companyPage.fillPinCode(updatedPinCode);
  await companyPage.submit();

  const alert = page.locator('#flashes');
  await expect(alert).toBeVisible();
  await expect(alert).toHaveClass(/alert-success/);
  await expect(alert).toContainText('Company updated Successfully');
});
