import { test } from '@playwright/test';
import { CompanyReportsPage } from '../pages/CompanyReportsPage';

test('get billing location details', async ({ page }) => {
  const companyReportsPage = new CompanyReportsPage(page);
  await companyReportsPage.loginAs('hr');
  await companyReportsPage.navigateTo();
  await companyReportsPage.clickDownloadIcon();
  await companyReportsPage.getBillingLocationDetails('US');
});
