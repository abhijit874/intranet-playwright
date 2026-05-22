import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { selectFromSingleSelect2 } from '../utils/test_helpers';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class CompanyPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page
      .locator('a.nav-link[data-turbo="false"][href="/companies"]', { hasText: 'Company' })
      .click();
    await expect(this.page).toHaveURL(/\/companies/i);
  }

  async clickAddCompany() {
    await this.page.getByRole('link', { name: 'Add Company' }).click();
    await expect(this.page).toHaveURL(/\/companies\/new/i);
  }

  async searchCompany(name: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(name);
  }

  async findCompanyRow(name: string) {
    const row = this.page.locator('table tbody tr', { hasText: name }).first();
    await expect(row).toBeVisible();
    return row;
  }

  async clickEditOnRow(name: string) {
    const row = await this.findCompanyRow(name);
    await row.locator('a[href$="/edit"]').click();
    await expect(this.page).toHaveURL(/\/companies\/\d+\/edit/i);
  }

  // --- Form fields ---

  async selectJoshEntity(label: string) {
    await this.page.locator('#company_josh_entity').selectOption({ label });
    await expect(this.page.locator('#company_josh_entity')).toHaveValue(/.+/);
  }

  async fillName(name: string) {
    await this.page.locator('#company_name').fill(name);
    await expect(this.page.locator('#company_name')).toHaveValue(name);
  }

  async setActive(checked: boolean) {
    await this.page.locator('#company_active').setChecked(checked);
  }

  async fillGstNo(gst: string) {
    await this.page.locator('input[type="text"]#company_gstno').fill(gst);
  }

  async fillInvoiceCode(code: string) {
    await this.page.getByLabel('Invoice Code').fill(code);
  }

  async fillWebsite(website: string) {
    const field = this.page.getByLabel('Website');
    await field.fill(website);
    await expect(field).toHaveValue(website);
  }

  async checkBillingLocationUs() {
    await this.page.locator('#company_billing_location_us').check();
  }

  async selectTimeZone(label: string) {
    await this.page.locator('#company_time_zone').selectOption({ label });
  }

  async selectBillingCurrency(currency: string) {
    await selectFromSingleSelect2(
      this.page,
      '#select2-company_billing_currency-container',
      currency
    );
    await expect(
      this.page.locator('#select2-company_billing_currency-container')
    ).toContainText(currency);
  }

  async fillSalesManager(name: string) {
    const field = this.page.getByLabel('Sales Manager');
    await field.fill(name);
    await expect(field).toHaveValue(name);
  }

  async checkExistingManager() {
    await this.page.locator('#company_existing_or_new_manager_existing').check();
  }

  async uploadLogo(filePath: string) {
    await this.page.locator('#company_logo').setInputFiles(filePath);
  }

  async uploadGstCard(filePath: string) {
    await this.page.locator('#company_gst_card').setInputFiles(filePath);
  }

  async uploadPanCard(filePath: string) {
    await this.page.locator('#company_pan_card').setInputFiles(filePath);
  }

  async uploadTanCard(filePath: string) {
    await this.page.locator('#company_tan_card').setInputFiles(filePath);
  }

  async fillTypeOfAddress(type: string) {
    const field = this.page.getByLabel('Type of address');
    await field.fill(type);
    await expect(field).toHaveValue(type);
  }

  async fillAddress(address: string) {
    const field = this.page.locator('#company_addresses_attributes_0_address');
    await field.fill(address);
    await expect(field).toHaveValue(address);
  }

  async fillCity(city: string) {
    const field = this.page.locator('#company_addresses_attributes_0_city');
    await field.fill(city);
    await expect(field).toHaveValue(city);
  }

  async fillState(state: string) {
    const field = this.page.locator('#company_addresses_attributes_0_state');
    await field.fill(state);
    await expect(field).toHaveValue(state);
  }

  async fillCountry(country: string) {
    const field = this.page.locator('#company_addresses_attributes_0_country');
    await field.fill(country);
    await expect(field).toHaveValue(country);
  }

  async fillLandline(phone: string) {
    const field = this.page.locator('#company_addresses_attributes_0_landline_no');
    await field.fill(phone);
    await expect(field).toHaveValue(phone);
  }

  async fillPinCode(pin: string) {
    const field = this.page.locator('#company_addresses_attributes_0_pin_code');
    await field.fill(pin);
    await expect(field).toHaveValue(pin);
  }

  async submit() {
    await this.page.locator('#company-submit').click();
  }

  // --- Download / reports ---

  async clickDownloadIcon() {
    await this.page.locator('i.fs-3.text-dark.ri-file-download-line').click();
  }

  async downloadCompanyCsv(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page
        .locator('a.dropdown-item.fs-6[href="/companies.csv"]', { hasText: 'Download Company CSV' })
        .click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }

  async getBillingLocationDetails(location: string) {
    await this.page
      .locator('a.dropdown-item.fs-6[data-bs-target="#billing_location_details_modal"]', {
        hasText: 'Billing Location Details',
      })
      .click();
    await this.page.locator('#billing_location').selectOption({ label: location });
    await expect(this.page.locator('#billing_location')).toHaveValue(/.+/);
    await this.page.locator('input[type="submit"][value="Export Report"]').click();
  }
}
