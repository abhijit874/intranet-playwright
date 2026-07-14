import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class InventoryReportsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    const assetsMenu = this.page.locator('a[aria-controls="assetsMenu"]', { hasText: 'Assets' });
    await assetsMenu.click();
    try {
      await expect(assetsMenu).toHaveAttribute('aria-expanded', 'true');
    } catch {
      throw new Error('Assets menu did not expand after clicking.');
    }
    await this.page
      .locator('a.nav-link[data-turbo="false"][href="/organisation_assets"]', { hasText: 'Inventory' })
      .click();
    try {
      await expect(this.page).toHaveURL(/\/organisation_assets/i);
    } catch {
      throw new Error('Failed to navigate to Inventory page.');
    }
  }

  async clickDownloadIcon() {
    await this.page.locator('i.fs-3.text-dark.ri-file-download-line').click();
  }

  async downloadInventoryReport(downloadDir: string, type: 'active' | 'inactive') {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const label = type === 'active' ? 'Active Assets' : 'Inactive Assets';
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page
        .locator(
          `a.dropdown-item.fs-6[href="/organisation_assets/download_report?report_type=${type}"]`,
          { hasText: label }
        )
        .click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }
}
