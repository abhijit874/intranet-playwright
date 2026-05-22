import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import { selectAssetDropdown } from '../../utils/test_helpers';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class MaintenancePage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    const assetsMenu = this.page.locator('a[aria-controls="assetsMenu"]', { hasText: 'Assets' });
    await assetsMenu.click();
    await this.page.locator('span.fs-6.pl-4', { hasText: 'Maintenance' }).click();
  }

  async clickAddAsset() {
    await this.page
      .locator('a.btn.btn-secondary[data-turbo="false"][href="/asset_maintainances/new"]', {
        hasText: 'Add Asset',
      })
      .click();
  }

  async selectMaintenanceAsset(name: string) {
    await selectAssetDropdown(
      this.page,
      '#new_asset_maintainance > div.row.control-group > div:nth-child(1) > div > span > span.selection > span',
      name
    );
  }

  async selectVendor(name: string) {
    await selectAssetDropdown(
      this.page,
      '#new_asset_maintainance > div.row.control-group > div:nth-child(2) > div > span > span.selection > span',
      name
    );
  }

  async fillCost(cost: string) {
    await this.page.locator('#asset_maintainance_maintainance_cost').clear();
    await this.page.locator('#asset_maintainance_maintainance_cost').fill(cost);
    await expect(this.page.locator('#asset_maintainance_maintainance_cost')).toHaveValue(cost);
  }

  async fillReason(reason: string) {
    await this.page.locator('#asset_maintainance_reason').fill(reason);
    await expect(this.page.locator('#asset_maintainance_reason')).toHaveValue(reason);
  }

  async fillFromDate(date: string) {
    await this.page.locator('#asset_maintainance_from_date').fill(date);
    await expect(this.page.locator('#asset_maintainance_from_date')).toHaveValue(date);
  }

  async fillEndDate(date: string) {
    await this.page.locator('#asset_maintainance_end_date').fill(date);
    await expect(this.page.locator('#asset_maintainance_end_date')).toHaveValue(date);
  }

  async uploadImage(filePath: string) {
    await this.page.locator('#asset_maintainance_asset_image').setInputFiles(filePath);
  }

  async submit() {
    await this.page
      .locator('input[type="submit"][name="commit"][value="Save"].btn.btn-secondary.controls')
      .click();
  }

  // --- Search & edit ---

  async searchMaintenance(query: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(query);
  }

  async findMaintenanceRow(query: string) {
    const row = this.page.locator('table tbody tr', { hasText: query }).first();
    await expect(row).toBeVisible();
    return row;
  }

  async clickEditOnRow(query: string) {
    const row = await this.findMaintenanceRow(query);
    await row.locator('a[href*="/edit"]').click();
  }

  async markAsReceived() {
    await this.page.locator('#asset_maintainance_is_asset_received').click();
  }

  // --- Download ---

  async downloadReport(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page
        .locator('a[href="asset_maintainances/download_report"] i.fs-3.text-dark.ri-file-download-line')
        .click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }
}
