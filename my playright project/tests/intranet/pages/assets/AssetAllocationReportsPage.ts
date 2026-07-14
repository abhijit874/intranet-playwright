import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class AssetAllocationReportsPage {
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
      .locator('a.nav-link[data-turbo="false"][href="/asset_allocations"]', { hasText: 'Allocation' })
      .click();
    try {
      await expect(this.page).toHaveURL(/\/asset_allocations/i);
    } catch {
      throw new Error('Failed to navigate to Asset Allocations page.');
    }
  }

  async clickDownloadIcon() {
    await this.page.locator('i.fs-3.text-dark.ri-file-download-line').click();
  }

  async downloadAllocationReport(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const [download] = await Promise.all([
      // Report generation can exceed the 15s actionTimeout, so wait longer.
      this.page.waitForEvent('download', { timeout: 60_000 }),
      this.page
        .locator('a.dropdown-item.fs-6[href="/asset_allocations/download_report"]', {
          hasText: 'Asset Allocation Report',
        })
        .click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }

  // Opens the PID-wise report modal from the (already open) download dropdown.
  // Unlike the allocation report, this menu item (href="#pid_wise_report_modal")
  // opens a modal rather than downloading directly.
  async openPidWiseReportModal() {
    await this.page
      .locator('a.dropdown-item', { hasText: 'PID-wise Asset Cost Report' })
      .click();

    const modal = this.page.locator('#pid_wise_report_modal');
    try {
      await expect(modal).toBeVisible();
    } catch {
      throw new Error('PID-wise Asset Cost Report modal did not open.');
    }
    return modal;
  }

  // Selects a month in the PID-wise modal's report-date dropdown and returns the
  // selected label (e.g. "May-2026"). Pass an <option> value like "2026-05", or
  // omit to select the most recent *previous* month (the second option) — this
  // avoids hardcoding a date that ages out of the rolling 12-month list.
  async selectPidWiseReportMonth(month?: string): Promise<string> {
    const select = this.page.locator('#pid_wise_report_modal #reportDate');
    try {
      await expect(select).toBeVisible();
    } catch {
      throw new Error('PID-wise report month dropdown (#reportDate) not found.');
    }

    if (month) {
      await select.selectOption(month);
    } else {
      const previousValue = await select.locator('option').nth(1).getAttribute('value');
      await select.selectOption(previousValue ?? '');
    }
    return ((await select.locator('option:checked').textContent()) ?? '').trim();
  }

  // Clicks the modal's "Download" button and saves the resulting file.
  async downloadFromPidWiseModal(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const modal = this.page.locator('#pid_wise_report_modal');
    const [download] = await Promise.all([
      // Report generation can exceed the 15s actionTimeout, so wait longer.
      this.page.waitForEvent('download', { timeout: 60_000 }),
      modal.locator('button[type="submit"]', { hasText: 'Download' }).click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }

  // Downloads the PID-wise report for the default (current) month.
  async downloadPidWiseAssetCostReport(downloadDir: string) {
    await this.openPidWiseReportModal();
    return this.downloadFromPidWiseModal(downloadDir);
  }
}
