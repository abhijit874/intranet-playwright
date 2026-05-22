import { test } from '@playwright/test';
import { CompanyPage } from '../pages/CompanyPage';

test('get billing location details', async ({ page }) => {
  const companyPage = new CompanyPage(page);
  await companyPage.loginAs('hr');
  await companyPage.navigateTo();
  await companyPage.clickDownloadIcon();
  await companyPage.getBillingLocationDetails('US');
});
