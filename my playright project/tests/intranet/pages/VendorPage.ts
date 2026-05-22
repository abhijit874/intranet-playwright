import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';

type UserKey = 'employee' | 'hr' | 'admin';

export class VendorPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.locator('a.nav-link[href="/vendors"]', { hasText: 'Vendors' }).click();
    await expect(this.page).toHaveURL(/\/vendors/);
  }

  async clickAddVendor() {
    await this.page
      .locator('a.btn.btn-secondary[href="/vendors/new"]', { hasText: 'Add Vendor' })
      .click();
    await expect(this.page).toHaveURL(/\/vendors\/new/);
  }

  async searchVendor(name: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(name);
  }

  async findVendorRow(name: string) {
    const row = this.page.locator('table tbody tr', { hasText: name }).first();
    await expect(row).toBeVisible();
    return row;
  }

  async clickEditOnRow(name: string) {
    const row = await this.findVendorRow(name);
    await row.locator('a[href*="/edit"]').click();
    await expect(this.page).toHaveURL(/\/vendors\/\d+\/edit/i);
  }

  // --- Vendor form fields ---

  async fillCompany(name: string) {
    await this.page.locator('#vendor_company').fill(name);
  }

  async fillCategory(category: string) {
    await this.page.locator('#vendor_category').fill(category);
  }

  async fillContractStartDate(date: string) {
    await this.page.locator('#vendor_contract_start_date').fill(date);
  }

  async fillContractEndDate(date: string) {
    await this.page.locator('#vendor_contract_end_date').fill(date);
  }

  async fillGstNumber(gst: string) {
    await this.page.locator('#vendor_gst_number').fill(gst);
  }

  async uploadGstFile(filePath: string) {
    await this.page.locator('#vendor_gst_registration_file').setInputFiles(filePath);
  }

  async fillPanNumber(pan: string) {
    await this.page.locator('#vendor_pan_number').fill(pan);
  }

  async uploadPanCard(filePath: string) {
    await this.page.locator('#vendor_pan_card').setInputFiles(filePath);
  }

  async fillMsmeNumber(no: string) {
    await this.page.locator('#vendor_msme_certificate_number').fill(no);
  }

  async uploadMsmeCertificate(filePath: string) {
    await this.page.locator('#vendor_msme_certificate_file').setInputFiles(filePath);
  }

  async fillVendorCode(code: string) {
    await this.page.locator('#vendor_vendor_code').fill(code);
  }

  async fillContactPersonName(name: string) {
    await this.page.locator('#vendor_contact_persons_attributes_0_name').fill(name);
  }

  async fillContactPersonRole(role: string) {
    await this.page.locator('#vendor_contact_persons_attributes_0_role').fill(role);
  }

  async fillContactPersonPhone(phone: string) {
    await this.page.locator('#vendor_contact_persons_attributes_0_phone_no').fill(phone);
  }

  async fillContactPersonEmail(email: string) {
    await this.page.locator('#vendor_contact_persons_attributes_0_email').fill(email);
  }

  async fillBankAccountHolderName(name: string) {
    await this.page.locator('#vendor_bank_detail_attributes_account_holder_name').fill(name);
  }

  async fillBankName(name: string) {
    await this.page.locator('#vendor_bank_detail_attributes_bank_name').fill(name);
  }

  async fillAccountNumber(no: string) {
    await this.page.locator('#vendor_bank_detail_attributes_account_number').fill(no);
  }

  async fillIfscCode(code: string) {
    await this.page.locator('#vendor_bank_detail_attributes_ifsc_code').fill(code);
  }

  async uploadBankDocument(filePath: string) {
    await this.page.locator('#vendor_bank_detail_attributes_document_attachment').setInputFiles(filePath);
  }

  async fillAddress(address: string) {
    await this.page.locator('#vendor_address_attributes_address').fill(address);
  }

  async fillCity(city: string) {
    await this.page.locator('#vendor_address_attributes_city').fill(city);
  }

  async fillPinCode(pin: string) {
    await this.page.locator('#vendor_address_attributes_pin_code').fill(pin);
  }

  async fillState(state: string) {
    await this.page.locator('#vendor_address_attributes_state').fill(state);
  }

  async fillCountry(country: string) {
    await this.page.locator('#vendor_address_attributes_country').fill(country);
  }

  async fillLandline(no: string) {
    await this.page.locator('#vendor_address_attributes_landline_no').fill(no);
  }

  async submit() {
    await this.page.locator('input[type="submit"][name="commit"][value="Save"]').click();
  }

  // --- Document upload ---

  async clickAddDocumentIcon(vendorName: string) {
    const row = await this.findVendorRow(vendorName);
    await row.locator('i.ri-add-large-line').click();
  }

  async fillDocumentFromDate(date: string) {
    await this.page.locator('input[name="from_date"][type="date"]').fill(date);
  }

  async fillDocumentToDate(date: string) {
    await this.page.locator('input[name="to_date"][type="date"]').fill(date);
  }

  async selectDocumentType(type: string) {
    await this.page.locator('select[name="document_type"]').selectOption(type);
  }

  async uploadDocumentFile(filePath: string) {
    await this.page.locator('input[name="documents[]"][type="file"]').setInputFiles(filePath);
  }

  async submitDocument() {
    await this.page.locator('input[type="submit"][name="commit"][value="Upload"]').click();
  }
}
