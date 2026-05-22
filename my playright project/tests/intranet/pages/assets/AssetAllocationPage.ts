import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import { selectAssetDropdown } from '../../utils/test_helpers';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class AssetAllocationPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    const assetsMenu = this.page.locator('a[aria-controls="assetsMenu"]', { hasText: 'Assets' });
    await assetsMenu.click();
    await expect(assetsMenu).toHaveAttribute('aria-expanded', 'true');
    await this.page
      .locator('a.nav-link[data-turbo="false"][href="/asset_allocations"]', { hasText: 'Allocation' })
      .click();
    await expect(this.page).toHaveURL(/\/asset_allocations/i);
  }

  async clickAddAssetAllocation() {
    await this.page
      .locator('a.btn.btn-secondary[data-turbo="false"][href="/asset_allocations/new"]', {
        hasText: 'Add Asset Allocation',
      })
      .click();
    await expect(this.page).toHaveURL(/\/asset_allocations\/new/i);
  }

  async selectAsset(name: string) {
    await selectAssetDropdown(this.page, '#select2-asset_allocation_asset_id-container', name);
  }

  async selectUser(name: string) {
    await selectAssetDropdown(this.page, '#select2-asset_allocation_user_id-container', name);
  }

  async selectAllocatedFrom(location: string) {
    await selectAssetDropdown(this.page, '#select2-asset_allocation_allocated_from-container', location);
  }

  async fillPurpose(purpose: string) {
    await this.page.locator('#asset_allocation_purpose').fill(purpose);
    await expect(this.page.locator('#asset_allocation_purpose')).toHaveValue(purpose);
  }

  async fillIssuedDate(date: string) {
    await this.page.locator('#asset_allocation_issued_date').fill(date);
    await expect(this.page.locator('#asset_allocation_issued_date')).toHaveValue(date);
  }

  async submit() {
    await this.page
      .locator('input[type="submit"][name="commit"][value="Save"].btn.btn-secondary.controls')
      .click();
  }

  // --- Search & edit ---

  async searchAllocation(query: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(query);
  }

  async findAllocationRow(query: string) {
    const row = this.page.locator('table tbody tr', { hasText: query }).first();
    await expect(row).toBeVisible();
    return row;
  }

  async clickEditOnRow(query: string) {
    const row = await this.findAllocationRow(query);
    await row.locator('a[href*="/edit"]').click();
    await expect(this.page).toHaveURL(/\/asset_allocations\/\d+\/edit/i);
  }

  async markAsReceived() {
    await this.page.locator('#asset_allocation_is_asset_received').click();
  }

  async fillReceivedDate(date: string) {
    await this.page.locator('#asset_allocation_received_date').fill(date);
    await expect(this.page.locator('#asset_allocation_received_date')).toHaveValue(date);
  }

  // --- Reports ---

  async clickDownloadIcon() {
    await this.page.locator('i.fs-3.text-dark.ri-file-download-line').click();
  }

  async downloadAllocationReport(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
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

  async downloadPidWiseAssetCostReport(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page
        .locator(
          'a.dropdown-item.fs-6[href="/asset_allocations/pid_wise_asset_cost_allocation_report"]',
          { hasText: 'PID-wise Asset Cost Report' }
        )
        .click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }
}
