import * as path from 'path';
import { CompanyPage } from '../pages/CompanyPage';

// Shared builder for the company specs so every test can create its own company
// (self-contained — no dependency on a pre-seeded record). Mirrors the vendor /
// asset / project helpers.

const IMAGE_PATH = path.join(__dirname, '../../fixtures/image.png');

export interface CompanyConfig {
  name?: string;
  filePath?: string;
}

export interface CreatedCompany {
  name: string;
  invoiceCode: string;
}

// The company list is searched by name, so it must be unique per run — a fixed
// name just piles up duplicates.
export function uniqueCompanyName(prefix = 'playwright company'): string {
  return `${prefix} ${Date.now()}`;
}

// Fills the whole "add company" form and submits it.
//
// Billing location (US) is left fixed because it drives which address/currency
// fields the form expects; Josh entity and time zone are picked at random since
// they're independent of that. Returns the identifying values so callers can find
// the exact company afterwards.
export async function createCompany(
  companyPage: CompanyPage,
  cfg: CompanyConfig = {}
): Promise<CreatedCompany> {
  const stamp = Date.now().toString();
  const name = cfg.name ?? uniqueCompanyName();
  const invoiceCode = `I${stamp.slice(-4)}`;
  const gst = `27ABCDE${stamp.slice(-4)}F1Z5`;
  const file = cfg.filePath ?? IMAGE_PATH;

  await companyPage.clickAddCompany();

  // Josh entity is NOT randomised: it drives conditional fields (some entities
  // hide the billing-currency picker entirely).
  await companyPage.selectJoshEntity('Josh India');
  await companyPage.fillName(name);
  await companyPage.setActive(true);
  await companyPage.fillGstNo(gst);
  await companyPage.fillInvoiceCode(invoiceCode);
  await companyPage.fillWebsite('https://openai.com');
  await companyPage.checkBillingLocationUs();
  await companyPage.selectRandomTimeZone();
  await companyPage.selectBillingCurrency('USD');
  await companyPage.fillSalesManager('Saurabh Gaji');
  await companyPage.checkExistingManager();
  await companyPage.uploadLogo(file);
  await companyPage.uploadGstCard(file);
  await companyPage.uploadPanCard(file);
  await companyPage.uploadTanCard(file);
  await companyPage.fillTypeOfAddress('primary');
  await companyPage.fillAddress('350 Fifth Avenue, New York, NY 10118');
  await companyPage.fillCity('New York');
  await companyPage.fillState('New York');
  await companyPage.fillCountry('USA');
  await companyPage.fillLandline('1234567890');
  await companyPage.fillPinCode('123456');
  await companyPage.submit();
  await companyPage.assertCreated();

  return { name, invoiceCode };
}
