import * as path from 'path';
import { VendorPage } from '../pages/VendorPage';
import { currentDateValue, futureDateValue } from '../utils/test_helpers';

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

// Fills the whole "add vendor" form and submits it. Every identifying or
// format-validated field is DERIVED per run rather than fixed:
//   - PAN  (5 letters + 4 digits + 1 letter) and GST (state code + PAN +
//     entity + Z + check char) share the run's stamp, so they're unique
//     together and pass the form's format validation.
//   - Account number, IFSC and MSME carry the stamp too, so no two vendors
//     ever share bank details.
//   - Contract dates are today -> +6 months, so they can never go stale the
//     way a hardcoded year does.
// Returns the identifying values so callers can find the exact vendor.
export async function createVendor(
  vendorPage: VendorPage,
  cfg: VendorConfig = {}
): Promise<CreatedVendor> {
  const now = Date.now().toString();
  const stamp = now.slice(-4);
  const company = cfg.company ?? uniqueVendorCompany();
  const category = cfg.category ?? 'AI';
  const pan = `ABCDE${stamp}F`;
  const gst = `27${pan}1Z5`;
  const accountNumber = `50100${now.slice(-9)}`; // 14 digits, unique per run
  const ifsc = `HDFC0${now.slice(-6)}`; // 4 letters + 0 + 6 chars
  const msme = `UDYAM-MH-26-${now.slice(-7)}`; // UDYAM-<state>-<2 digits>-<7 digits>
  const code = `playwright-${now}`;
  const file = cfg.filePath ?? IMAGE_PATH;

  await vendorPage.clickAddVendor();

  await vendorPage.fillCompany(company);
  await vendorPage.fillCategory(category);
  await vendorPage.fillContractStartDate(cfg.contractStart ?? currentDateValue());
  await vendorPage.fillContractEndDate(cfg.contractEnd ?? futureDateValue(180));
  await vendorPage.fillGstNumber(gst);
  await vendorPage.uploadGstFile(file);
  await vendorPage.fillPanNumber(pan);
  await vendorPage.uploadPanCard(file);
  await vendorPage.fillMsmeNumber(msme);
  await vendorPage.uploadMsmeCertificate(file);
  await vendorPage.fillVendorCode(code);
  await vendorPage.fillContactPersonName('john doe');
  await vendorPage.fillContactPersonRole('CEO');
  await vendorPage.fillContactPersonPhone('1234567890');
  await vendorPage.fillContactPersonEmail('johndoe@gmail.com');
  await vendorPage.fillBankAccountHolderName('john doe');
  await vendorPage.fillBankName('HDFC bank');
  await vendorPage.fillAccountNumber(accountNumber);
  await vendorPage.fillIfscCode(ifsc);
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
