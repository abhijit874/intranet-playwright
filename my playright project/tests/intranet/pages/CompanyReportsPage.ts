import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class CompanyReportsPage {
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
    try {
      await expect(this.page.locator('#billing_location')).toHaveValue(/.+/);
    } catch {
      throw new Error(`Billing location "${location}" was not selected correctly.`);
    }
    await this.page.locator('input[type="submit"][value="Export Report"]').click();
  }
}
