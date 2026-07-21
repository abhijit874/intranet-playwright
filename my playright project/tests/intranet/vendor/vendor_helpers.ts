import * as path from 'path';
import { VendorPage } from '../pages/VendorPage';

// Shared builder for the vendor specs so every test can create its own vendor
// (self-contained — no dependency on a pre-seeded record). Mirrors the asset /
// project helpers.

const IMAGE_PATH = path.join(__dirname, '../../fixtures/image.png');

export interface VendorConfig {
  company?: string;
  category?: string;
  contractStart?: string;
  contractEnd?: string;
  filePath?: string;
}

export interface CreatedVendor {
  company: string;
  category: string;
  code: string;
}

// The vendor list is searched by company name, so it must be unique per run —
// a fixed name just piles up duplicates.
export function uniqueVendorCompany(prefix = 'playwright vendor'): string {
  return `${prefix} ${Date.now()}`;
}

// Fills the whole "add vendor" form and submits it. GST/PAN must be unique and
// well-formed, so they're derived from a per-run stamp. Returns the identifying
// values so callers can find the exact vendor afterwards.
export async function createVendor(
  vendorPage: VendorPage,
  cfg: VendorConfig = {}
): Promise<CreatedVendor> {
  const stamp = Date.now().toString().slice(-4);
  const company = cfg.company ?? uniqueVendorCompany();
  const category = cfg.category ?? 'AI';
  const pan = `ABCDE${stamp}F`;
  const gst = `27${pan}1Z5`;
  const code = `playwright-${Date.now()}`;
  const file = cfg.filePath ?? IMAGE_PATH;

  await vendorPage.clickAddVendor();

  await vendorPage.fillCompany(company);
  await vendorPage.fillCategory(category);
  await vendorPage.fillContractStartDate(cfg.contractStart ?? '2026-05-10');
  await vendorPage.fillContractEndDate(cfg.contractEnd ?? '2026-12-31');
  await vendorPage.fillGstNumber(gst);
  await vendorPage.uploadGstFile(file);
  await vendorPage.fillPanNumber(pan);
  await vendorPage.uploadPanCard(file);
  await vendorPage.fillMsmeNumber('MSME-AUTO-12345');
  await vendorPage.uploadMsmeCertificate(file);
  await vendorPage.fillVendorCode(code);
  await vendorPage.fillContactPersonName('john doe');
  await vendorPage.fillContactPersonRole('CEO');
  await vendorPage.fillContactPersonPhone('1234567890');
  await vendorPage.fillContactPersonEmail('johndoe@gmail.com');
  await vendorPage.fillBankAccountHolderName('jhon doe');
  await vendorPage.fillBankName('HDFC bank');
  await vendorPage.fillAccountNumber('50100123456789');
  await vendorPage.fillIfscCode('HDFC0001234');
  await vendorPage.uploadBankDocument(file);
  await vendorPage.fillAddress('123 Automation Street, Pune, Maharashtra');
  await vendorPage.fillCity('Pune');
  await vendorPage.fillPinCode('123456');
  await vendorPage.fillState('Maharashtra');
  await vendorPage.fillCountry('India');
  await vendorPage.fillLandline('1234567890');
  await vendorPage.submit();
  // Wait for the create to land before the caller navigates away — otherwise the
  // in-flight POST is abandoned and the vendor is never created.
  await vendorPage.assertSaved();

  return { company, category, code };
}
