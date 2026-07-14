import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { filterTableBySearch } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin';

export class VendorDocumentPage {
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
