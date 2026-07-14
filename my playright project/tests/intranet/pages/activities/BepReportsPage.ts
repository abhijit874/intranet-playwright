import { Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class BepReportsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  // --- Navigation ---

  async navigateToBepReports() {
    await this.page.getByText('Activity and Benefits').click();
    await this.page.locator('a[href="#reportsMenu"]').click();
    await this.page.locator('span.fs-6.pl-4', { hasText: 'BEP Reports' }).click();
  }

  // --- BEP Reports ---

  async selectBepYear(year: string) {
    await this.page.locator('#year').selectOption(year);
  }

  async selectBepQuarter(quarter: string) {
    await this.page.locator('#quarter').selectOption(quarter);
  }

  async downloadApprovedBenefits(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    await this.page
      .locator('button.btn-outline-secondary[data-bs-toggle="dropdown"]', { hasText: 'Reports' })
      .click();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('a.dropdown-item', { hasText: 'Approved Benefits Report' }).click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }

  async downloadActivityReport(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    await this.page
      .locator('button.btn-outline-secondary[data-bs-toggle="dropdown"]', { hasText: 'Reports' })
      .click();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page
        .locator('a.dropdown-item[href*="download_activity_csv"]', { hasText: 'Activity Report' })
        .click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }
}
