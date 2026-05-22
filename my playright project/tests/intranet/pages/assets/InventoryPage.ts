import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import { selectAssetDropdown } from '../../utils/test_helpers';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class InventoryPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    const assetsMenu = this.page.locator('a[aria-controls="assetsMenu"]', { hasText: 'Assets' });
    await assetsMenu.click();
    await expect(assetsMenu).toHaveAttribute('aria-expanded', 'true');
    await this.page
      .locator('a.nav-link[data-turbo="false"][href="/organisation_assets"]', { hasText: 'Inventory' })
      .click();
    await expect(this.page).toHaveURL(/\/organisation_assets/i);
  }

  async clickAddAsset() {
    await this.page.getByRole('link', { name: 'Add Asset' }).click();
    await expect(this.page).toHaveURL(/\/organisation_assets\/new/i);
  }

  async selectCategory(category: string) {
    await selectAssetDropdown(this.page, '#select2-asset_category-container', category);
  }

  async selectHardwareType(type: string) {
    await selectAssetDropdown(this.page, '#select2-asset_hardware_type-container', type);
  }

  async selectAssetType(type: string) {
    await selectAssetDropdown(this.page, '#select2-asset_asset_type-container', type);
  }

  async fillRam(value: string) {
    await this.page.locator('#asset_ram').clear();
    await this.page.locator('#asset_ram').fill(value);
    await expect(this.page.locator('#asset_ram')).toHaveValue(value);
  }

  async fillRom(value: string) {
    await this.page.locator('#asset_rom').clear();
    await this.page.locator('#asset_rom').fill(value);
    await expect(this.page.locator('#asset_rom')).toHaveValue(value);
  }

  async selectOs(label: string) {
    await this.page.locator('#asset_os').selectOption({ label });
    await expect(this.page.locator('#asset_os')).toHaveValue(/.+/);
  }

  async checkWithCharger() {
    await this.page.locator('#asset_with_charger_true').check();
    await expect(this.page.locator('#asset_with_charger_true')).toBeChecked();
  }

  async fillChargerSerial(no: string) {
    await this.page.locator('#charger_serial_number').fill(no);
    await expect(this.page.locator('#charger_serial_number')).toHaveValue(no);
  }

  async selectManufacturingCompany(company: string) {
    await selectAssetDropdown(this.page, '#select2-asset_manufacturing_company-container', company);
  }

  async selectAssetName(name: string) {
    await selectAssetDropdown(this.page, '#select2-asset_name-container', name);
  }

  async fillSerialNumber(no: string) {
    await this.page.locator('#asset_serial_number').fill(no);
    await expect(this.page.locator('#asset_serial_number')).toHaveValue(no);
  }

  async fillVersion(version: string) {
    await this.page.locator('#asset_version').clear();
    await this.page.locator('#asset_version').fill(version);
    await expect(this.page.locator('#asset_version')).toHaveValue(version);
  }

  async selectLocation(location: string) {
    await selectAssetDropdown(this.page, '#select2-asset_location-container', location);
  }

  async selectAssetOf(value: string) {
    await selectAssetDropdown(this.page, '#select2-asset_asset_of-container', value);
  }

  async selectVendor(name: string) {
    await expect(this.page.locator('#select2-asset_vendor_id-container')).toBeVisible();
    await selectAssetDropdown(this.page, '#select2-asset_vendor_id-container', name);
  }

  async selectClient(placeholderText: string, optionText: string) {
    await this.page.getByRole('combobox', { name: placeholderText, exact: true }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
    await expect(this.page.getByRole('combobox', { name: optionText, exact: true })).toBeVisible();
  }

  async fillMonthlyCost(cost: string) {
    await expect(this.page.locator('#asset_monthly_cost')).toBeVisible();
    await this.page.locator('#asset_monthly_cost').clear();
    await this.page.locator('#asset_monthly_cost').fill(cost);
    await expect(this.page.locator('#asset_monthly_cost')).toHaveValue(cost);
  }

  async selectAvailabilityStatus(status: string) {
    await selectAssetDropdown(this.page, '#select2-asset_availability_status-container', status);
  }

  async fillReceivedDate(date: string) {
    await this.page.locator('#asset_received_date').fill(date);
    await expect(this.page.locator('#asset_received_date')).toHaveValue(date);
  }

  async fillLockingPeriod(period: string) {
    await this.page.locator('#asset_locking_period').clear();
    await this.page.locator('#asset_locking_period').fill(period);
    await expect(this.page.locator('#asset_locking_period')).toHaveValue(period);
  }

  async submit() {
    await this.page.locator('input[type="submit"][name="commit"][value="Save"]').click();
  }

  // --- Search & edit ---

  async searchAsset(query: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(query);
  }

  async findAssetRow(query: string) {
    const row = this.page.locator('table tbody tr', { hasText: query }).first();
    await expect(row).toBeVisible();
    return row;
  }

  async clickEditOnRow(query: string) {
    const row = await this.findAssetRow(query);
    await row.locator('a[href*="/edit"]').click();
    await expect(this.page).toHaveURL(/\/organisation_assets\/\d+\/edit/i);
  }

  async fillDiscontinueDate(date: string) {
    const field = this.page.locator('#asset_discontinue_date');
    await expect(field).toBeVisible();
    await field.fill(date);
    await expect(field).toHaveValue(date);
  }

  // --- Download reports ---

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
