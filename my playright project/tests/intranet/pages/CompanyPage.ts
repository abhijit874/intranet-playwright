import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { selectFromSingleSelect2, filterTableBySearch } from '../utils/test_helpers';

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
    try {
      await expect(this.page).toHaveURL(/\/companies/i);
    } catch {
      throw new Error('Failed to navigate to Companies page.');
    }
  }

  async clickAddCompany() {
    await this.page.getByRole('link', { name: 'Add Company' }).click();
    try {
      await expect(this.page).toHaveURL(/\/companies\/new/i);
    } catch {
      throw new Error('Failed to navigate to Add Company page.');
    }
  }

  async searchCompany(name: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(name);
  }

  async findCompanyRow(name: string) {
    await filterTableBySearch(this.page, name);
    const row = this.page.locator('table tbody tr', { hasText: name }).first();
    try {
      await expect(row).toBeVisible();
    } catch {
      throw new Error(`Company row not found for: "${name}".`);
    }
    return row;
  }

  async clickEditOnRow(name: string) {
    const row = await this.findCompanyRow(name);
    await row.locator('a[href$="/edit"]').click();
    try {
      await expect(this.page).toHaveURL(/\/companies\/\d+\/edit/i);
    } catch {
      throw new Error(`Failed to navigate to edit page for company: "${name}".`);
    }
  }

  // --- Form fields ---

  async selectJoshEntity(label: string) {
    await this.page.locator('#company_josh_entity').selectOption({ label });
    try {
      await expect(this.page.locator('#company_josh_entity')).toHaveValue(/.+/);
    } catch {
      throw new Error(`Failed to select Josh entity: "${label}".`);
    }
  }

  async fillName(name: string) {
    await this.page.locator('#company_name').fill(name);
    try {
      await expect(this.page.locator('#company_name')).toHaveValue(name);
    } catch {
      throw new Error(`Failed to fill company name field with value: "${name}".`);
    }
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
    try {
      await expect(field).toHaveValue(website);
    } catch {
      throw new Error(`Failed to fill website field with value: "${website}".`);
    }
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
    try {
      await expect(
        this.page.locator('#select2-company_billing_currency-container')
      ).toContainText(currency);
    } catch {
      throw new Error(`Billing currency "${currency}" was not selected correctly.`);
    }
  }

  async fillSalesManager(name: string) {
    const field = this.page.getByLabel('Sales Manager');
    await field.fill(name);
    try {
      await expect(field).toHaveValue(name);
    } catch {
      throw new Error(`Failed to fill sales manager field with value: "${name}".`);
    }
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
    try {
      await expect(field).toHaveValue(type);
    } catch {
      throw new Error(`Failed to fill type of address field with value: "${type}".`);
    }
  }

  async fillAddress(address: string) {
    const field = this.page.locator('#company_addresses_attributes_0_address');
    await field.fill(address);
    try {
      await expect(field).toHaveValue(address);
    } catch {
      throw new Error(`Failed to fill address field with value: "${address}".`);
    }
  }

  async fillCity(city: string) {
    const field = this.page.locator('#company_addresses_attributes_0_city');
    await field.fill(city);
    try {
      await expect(field).toHaveValue(city);
    } catch {
      throw new Error(`Failed to fill city field with value: "${city}".`);
    }
  }

  async fillState(state: string) {
    const field = this.page.locator('#company_addresses_attributes_0_state');
    await field.fill(state);
    try {
      await expect(field).toHaveValue(state);
    } catch {
      throw new Error(`Failed to fill state field with value: "${state}".`);
    }
  }

  async fillCountry(country: string) {
    const field = this.page.locator('#company_addresses_attributes_0_country');
    await field.fill(country);
    try {
      await expect(field).toHaveValue(country);
    } catch {
      throw new Error(`Failed to fill country field with value: "${country}".`);
    }
  }

  async fillLandline(phone: string) {
    const field = this.page.locator('#company_addresses_attributes_0_landline_no');
    await field.fill(phone);
    try {
      await expect(field).toHaveValue(phone);
    } catch {
      throw new Error(`Failed to fill landline field with value: "${phone}".`);
    }
  }

  async fillPinCode(pin: string) {
    const field = this.page.locator('#company_addresses_attributes_0_pin_code');
    await field.fill(pin);
    try {
      await expect(field).toHaveValue(pin);
    } catch {
      throw new Error(`Failed to fill pin code field with value: "${pin}".`);
    }
  }

  async submit() {
    await this.page.locator('#company-submit').click();
  }

  async assertNotCreated() {
    await this.page.waitForLoadState('networkidle');
    const successFlash = this.page
      .locator('#flashes')
      .filter({ hasText: 'Company created Successfully' });
    await expect(
      successFlash,
      'Company was created without required fields — server-side validation was bypassed.'
    ).toHaveCount(0);
  }
}
