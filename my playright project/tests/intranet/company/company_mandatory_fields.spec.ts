import { test } from '@playwright/test';
import { CompanyPage } from '../pages/CompanyPage';

test('mandatory fields - company must not be created without required data', async ({ page }) => {
  const companyPage = new CompanyPage(page);
  await companyPage.loginAs('hr');
  await companyPage.navigateTo();
  await companyPage.clickAddCompany();
  // Submit without filling any required fields
  await companyPage.submit();
  // If the company is created successfully, validation was bypassed — fail the test
  await companyPage.assertNotCreated();
});
