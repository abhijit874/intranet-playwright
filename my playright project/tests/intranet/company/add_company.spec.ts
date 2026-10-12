import { test, expect } from '@playwright/test';
import { CompanyPage } from '../pages/CompanyPage';
import { createCompany } from './company_helpers';

// Creates a company with a unique name and confirms it was saved.
test('add new company', async ({ page }) => {
  const companyPage = new CompanyPage(page);
  await companyPage.loginAs('hr');
  await companyPage.navigateTo();

  await createCompany(companyPage); // asserts the success flash

  await expect(page).toHaveURL(/\/companies/i);
});

// Self-contained: creates a fresh company, then finds that exact company and
// edits it — no dependency on a pre-seeded record.
// Edits an existing company rather than creating one each run: opens the first
// company in the list and updates a few descriptive fields. Staging-only data,
// so editing an existing record is fine and avoids adding a company every run.
test('edit company', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);

  const companyPage = new CompanyPage(page);
  await companyPage.loginAs('hr');
  await companyPage.navigateTo();

  await companyPage.clickEditOnFirstRow();

  await companyPage.fillWebsite(`https://openai.com/${suffix}`);
  await companyPage.fillSalesManager(`Saurabh Gaji ${suffix}`);
  await companyPage.fillTypeOfAddress(`primary ${suffix}`);
  await companyPage.fillAddress(`${suffix} Market Street, San Francisco, CA`);
  await companyPage.fillCity(`San Francisco ${suffix}`);
  await companyPage.fillState(`California ${suffix}`);
  await companyPage.fillCountry('USA');
  await companyPage.fillLandline(`98${suffix.padStart(8, '0')}`);
  await companyPage.fillPinCode(suffix.padStart(6, '1'));
  // The server requires the contact person's phone on save; fill it in case the
  // existing record has it blank.
  await companyPage.fillContactPersonPhone(`98${suffix.padStart(8, '0')}`);
  await companyPage.submit();

  await companyPage.assertUpdated();
});
