import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { filterTableBySearch } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin';

export class VendorPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.locator('a.nav-link[href="/vendors"]', { hasText: 'Vendors' }).click();
    try {
      await expect(this.page).toHaveURL(/\/vendors/);
    } catch {
      throw new Error('Failed to navigate to Vendors page.');
    }
  }

  async clickAddVendor() {
    await this.page
      .locator('a.btn.btn-secondary[href="/vendors/new"]', { hasText: 'Add Vendor' })
      .click();
    try {
      await expect(this.page).toHaveURL(/\/vendors\/new/);
    } catch {
      throw new Error('Failed to navigate to Add Vendor page.');
    }
  }

  async searchVendor(name: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(name);
  }

  async findVendorRow(name: string) {
    await filterTableBySearch(this.page, name);
    const row = this.page.locator('table tbody tr', { hasText: name }).first();
    try {
      await expect(row).toBeVisible();
    } catch {
      throw new Error(`Vendor row not found for: "${name}".`);
    }
    return row;
  }

  async clickEditOnRow(name: string) {
    const row = await this.findVendorRow(name);
    await row.locator('a[href*="/edit"]').click();
    try {
      await expect(this.page).toHaveURL(/\/vendors\/\d+\/edit/i);
    } catch {
      throw new Error(`Failed to navigate to edit page for vendor: "${name}".`);
    }
  }

  // --- Mandatory fields ---

  async fillCompany(name: string) {
    const field = this.page.locator('#vendor_company');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Company name is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(name);
    try {
      await expect(field).toHaveValue(name);
    } catch {
      throw new Error(`Company name is a mandatory field - failed to fill with value: "${name}".`);
    }
  }

  async fillCategory(category: string) {
    const field = this.page.locator('#vendor_category');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Category is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(category);
    try {
      await expect(field).toHaveValue(category);
    } catch {
      throw new Error(`Category is a mandatory field - failed to fill with value: "${category}".`);
    }
  }

  async fillGstNumber(gst: string) {
    const field = this.page.locator('#vendor_gst_number');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('GST number is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(gst);
    try {
      await expect(field).toHaveValue(gst);
    } catch {
      throw new Error(
        `GST number is a mandatory field - failed to fill with value: "${gst}". ` +
        'Check if the GST format is valid (e.g. 22AAAAA0000A1Z5).'
      );
    }
  }

  async uploadGstFile(filePath: string) {
    const field = this.page.locator('#vendor_gst_registration_file');
    if (!(await field.count())) {
      throw new Error('GST registration file upload is a mandatory field - input not found on the vendor form.');
    }
    await field.setInputFiles(filePath);
  }

  async fillPanNumber(pan: string) {
    const field = this.page.locator('#vendor_pan_number');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('PAN number is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(pan);
    try {
      await expect(field).toHaveValue(pan);
    } catch {
      throw new Error(
        `PAN number is a mandatory field - failed to fill with value: "${pan}". ` +
        'Check if the PAN format is valid (e.g. AAAAA0000A).'
      );
    }
  }

  async uploadPanCard(filePath: string) {
    const field = this.page.locator('#vendor_pan_card');
    if (!(await field.count())) {
      throw new Error('PAN card upload is a mandatory field - input not found on the vendor form.');
    }
    await field.setInputFiles(filePath);
  }

  async fillVendorCode(code: string) {
    const field = this.page.locator('#vendor_vendor_code');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Vendor code is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(code);
    try {
      await expect(field).toHaveValue(code);
    } catch {
      throw new Error(`Vendor code is a mandatory field - failed to fill with value: "${code}".`);
    }
  }

  async fillContactPersonName(name: string) {
    const field = this.page.locator('#vendor_contact_persons_attributes_0_name');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Contact person name is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(name);
    try {
      await expect(field).toHaveValue(name);
    } catch {
      throw new Error(`Contact person name is a mandatory field - failed to fill with value: "${name}".`);
    }
  }

  async fillContactPersonRole(role: string) {
    const field = this.page.locator('#vendor_contact_persons_attributes_0_role');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Contact person role is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(role);
    try {
      await expect(field).toHaveValue(role);
    } catch {
      throw new Error(`Contact person role is a mandatory field - failed to fill with value: "${role}".`);
    }
  }

  async fillContactPersonPhone(phone: string) {
    const field = this.page.locator('#vendor_contact_persons_attributes_0_phone_no');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Contact person phone number is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(phone);
    try {
      await expect(field).toHaveValue(phone);
    } catch {
      throw new Error(
        `Contact person phone number is a mandatory field - failed to fill with value: "${phone}". ` +
        'Check if the phone number format is valid.'
      );
    }
  }

  async fillContactPersonEmail(email: string) {
    const field = this.page.locator('#vendor_contact_persons_attributes_0_email');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Contact person email is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(email);
    try {
      await expect(field).toHaveValue(email);
    } catch {
      throw new Error(
        `Contact person email is a mandatory field - failed to fill with value: "${email}". ` +
        'Check if the email format is valid (e.g. name@example.com).'
      );
    }
  }

  async fillBankAccountHolderName(name: string) {
    const field = this.page.locator('#vendor_bank_detail_attributes_account_holder_name');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Bank account holder name is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(name);
    try {
      await expect(field).toHaveValue(name);
    } catch {
      throw new Error(`Bank account holder name is a mandatory field - failed to fill with value: "${name}".`);
    }
  }

  async fillBankName(name: string) {
    const field = this.page.locator('#vendor_bank_detail_attributes_bank_name');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Bank name is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(name);
    try {
      await expect(field).toHaveValue(name);
    } catch {
      throw new Error(`Bank name is a mandatory field - failed to fill with value: "${name}".`);
    }
  }

  async fillAccountNumber(no: string) {
    const field = this.page.locator('#vendor_bank_detail_attributes_account_number');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Bank account number is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(no);
    try {
      await expect(field).toHaveValue(no);
    } catch {
      throw new Error(`Bank account number is a mandatory field - failed to fill with value: "${no}".`);
    }
  }

  async fillIfscCode(code: string) {
    const field = this.page.locator('#vendor_bank_detail_attributes_ifsc_code');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('IFSC code is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(code);
    try {
      await expect(field).toHaveValue(code);
    } catch {
      throw new Error(
        `IFSC code is a mandatory field - failed to fill with value: "${code}". ` +
        'Check if the IFSC format is valid (e.g. SBIN0001234).'
      );
    }
  }

  async uploadBankDocument(filePath: string) {
    const field = this.page.locator('#vendor_bank_detail_attributes_document_attachment');
    if (!(await field.count())) {
      throw new Error('Bank document upload is a mandatory field - input not found on the vendor form.');
    }
    await field.setInputFiles(filePath);
  }

  async fillAddress(address: string) {
    const field = this.page.locator('#vendor_address_attributes_address');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Address is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(address);
    try {
      await expect(field).toHaveValue(address);
    } catch {
      throw new Error(`Address is a mandatory field - failed to fill with value: "${address}".`);
    }
  }

  async fillCity(city: string) {
    const field = this.page.locator('#vendor_address_attributes_city');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('City is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(city);
    try {
      await expect(field).toHaveValue(city);
    } catch {
      throw new Error(`City is a mandatory field - failed to fill with value: "${city}".`);
    }
  }

  async fillCountry(country: string) {
    const field = this.page.locator('#vendor_address_attributes_country');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Country is a mandatory field - field not found on the vendor form.');
    }
    await field.fill(country);
    try {
      await expect(field).toHaveValue(country);
    } catch {
      throw new Error(`Country is a mandatory field - failed to fill with value: "${country}".`);
    }
  }

  // --- Optional fields ---

  async fillContractStartDate(date: string) {
    const field = this.page.locator('#vendor_contract_start_date');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Contract start date field not found on the vendor form.');
    }
    await field.fill(date);
    try {
      await expect(field).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill contract start date field with value: "${date}".`);
    }
  }

  async fillContractEndDate(date: string) {
    const field = this.page.locator('#vendor_contract_end_date');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Contract end date field not found on the vendor form.');
    }
    await field.fill(date);
    try {
      await expect(field).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill contract end date field with value: "${date}".`);
    }
  }

  async fillMsmeNumber(no: string) {
    const field = this.page.locator('#vendor_msme_certificate_number');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('MSME certificate number field not found on the vendor form.');
    }
    await field.fill(no);
    try {
      await expect(field).toHaveValue(no);
    } catch {
      throw new Error(`Failed to fill MSME certificate number field with value: "${no}".`);
    }
  }

  async uploadMsmeCertificate(filePath: string) {
    await this.page.locator('#vendor_msme_certificate_file').setInputFiles(filePath);
  }

  async fillPinCode(pin: string) {
    const field = this.page.locator('#vendor_address_attributes_pin_code');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Pin code field not found on the vendor form.');
    }
    await field.fill(pin);
    try {
      await expect(field).toHaveValue(pin);
    } catch {
      throw new Error(`Failed to fill pin code field with value: "${pin}".`);
    }
  }

  async fillState(state: string) {
    const field = this.page.locator('#vendor_address_attributes_state');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('State field not found on the vendor form.');
    }
    await field.fill(state);
    try {
      await expect(field).toHaveValue(state);
    } catch {
      throw new Error(`Failed to fill state field with value: "${state}".`);
    }
  }

  async fillLandline(no: string) {
    const field = this.page.locator('#vendor_address_attributes_landline_no');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Landline number field not found on the vendor form.');
    }
    await field.fill(no);
    try {
      await expect(field).toHaveValue(no);
    } catch {
      throw new Error(`Failed to fill landline number field with value: "${no}".`);
    }
  }

  async submit() {
    await this.page.locator('input[type="submit"][name="commit"][value="Save"]').click();
  }

  async assertNotSaved() {
    await this.page.waitForLoadState('networkidle');
    await expect(
      this.page,
      'Vendor was saved without required fields — server-side validation was bypassed.'
    ).toHaveURL(/\/vendors\/new/);
  }
}
