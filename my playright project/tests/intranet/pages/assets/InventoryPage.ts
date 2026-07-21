import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import {
  selectAssetDropdown,
  filterTableBySearch,
  expectFlashMessage,
  selectRandomFromAssetDropdown,
} from '../../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin';

export class InventoryPage {
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

  async clickAddAsset() {
    await this.page.getByRole('link', { name: 'Add Asset' }).click();
    try {
      await expect(this.page).toHaveURL(/\/organisation_assets\/new/i);
    } catch {
      throw new Error('Failed to navigate to Add Asset page.');
    }
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
    try {
      await expect(this.page.locator('#asset_ram')).toHaveValue(value);
    } catch {
      throw new Error(`Failed to fill RAM field with value: "${value}".`);
    }
  }

  async fillRom(value: string) {
    await this.page.locator('#asset_rom').clear();
    await this.page.locator('#asset_rom').fill(value);
    try {
      await expect(this.page.locator('#asset_rom')).toHaveValue(value);
    } catch {
      throw new Error(`Failed to fill ROM field with value: "${value}".`);
    }
  }

  async selectOs(label: string) {
    await this.page.locator('#asset_os').selectOption({ label });
    try {
      await expect(this.page.locator('#asset_os')).toHaveValue(/.+/);
    } catch {
      throw new Error(`Failed to select OS: "${label}".`);
    }
  }

  async checkWithCharger() {
    await this.page.locator('#asset_with_charger_true').check();
    try {
      await expect(this.page.locator('#asset_with_charger_true')).toBeChecked();
    } catch {
      throw new Error('With charger checkbox was not checked successfully.');
    }
  }

  async fillChargerSerial(no: string) {
    await this.page.locator('#charger_serial_number').fill(no);
    try {
      await expect(this.page.locator('#charger_serial_number')).toHaveValue(no);
    } catch {
      throw new Error(`Failed to fill charger serial number field with value: "${no}".`);
    }
  }

  async selectManufacturingCompany(company: string) {
    await selectAssetDropdown(this.page, '#select2-asset_manufacturing_company-container', company);
  }

  // Random manufacturer. The asset-name list depends on it, so call
  // selectRandomAssetName() afterwards rather than a fixed name.
  async selectRandomManufacturingCompany(): Promise<string> {
    return selectRandomFromAssetDropdown(this.page, '#select2-asset_manufacturing_company-container');
  }

  async selectAssetName(name: string) {
    await selectAssetDropdown(this.page, '#select2-asset_name-container', name);
  }

  // Random asset name from whatever the chosen manufacturer offers.
  async selectRandomAssetName(): Promise<string> {
    return selectRandomFromAssetDropdown(this.page, '#select2-asset_name-container');
  }

  async fillSerialNumber(no: string) {
    await this.page.locator('#asset_serial_number').fill(no);
    try {
      await expect(this.page.locator('#asset_serial_number')).toHaveValue(no);
    } catch {
      throw new Error(`Failed to fill serial number field with value: "${no}".`);
    }
  }

  async fillVersion(version: string) {
    await this.page.locator('#asset_version').clear();
    await this.page.locator('#asset_version').fill(version);
    try {
      await expect(this.page.locator('#asset_version')).toHaveValue(version);
    } catch {
      throw new Error(`Failed to fill version field with value: "${version}".`);
    }
  }

  async selectLocation(location: string) {
    await selectAssetDropdown(this.page, '#select2-asset_location-container', location);
  }

  async selectRandomLocation(): Promise<string> {
    return selectRandomFromAssetDropdown(this.page, '#select2-asset_location-container');
  }

  async selectAssetOf(value: string) {
    await selectAssetDropdown(this.page, '#select2-asset_asset_of-container', value);
  }

  async selectVendor(name: string) {
    try {
      await expect(this.page.locator('#select2-asset_vendor_id-container')).toBeVisible();
    } catch {
      throw new Error('Vendor dropdown not found on the asset form.');
    }
    await selectAssetDropdown(this.page, '#select2-asset_vendor_id-container', name);
  }

  async selectRandomVendor(): Promise<string> {
    try {
      await expect(this.page.locator('#select2-asset_vendor_id-container')).toBeVisible();
    } catch {
      throw new Error('Vendor dropdown not found on the asset form.');
    }
    return selectRandomFromAssetDropdown(this.page, '#select2-asset_vendor_id-container');
  }

  async selectClient(placeholderText: string, optionText: string) {
    await this.page.getByRole('combobox', { name: placeholderText, exact: true }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
    try {
      await expect(this.page.getByRole('combobox', { name: optionText, exact: true })).toBeVisible();
    } catch {
      throw new Error(`Client "${optionText}" was not selected correctly.`);
    }
  }

  async fillMonthlyCost(cost: string) {
    try {
      await expect(this.page.locator('#asset_monthly_cost')).toBeVisible();
    } catch {
      throw new Error('Monthly cost field not found on the asset form.');
    }
    await this.page.locator('#asset_monthly_cost').clear();
    await this.page.locator('#asset_monthly_cost').fill(cost);
    try {
      await expect(this.page.locator('#asset_monthly_cost')).toHaveValue(cost);
    } catch {
      throw new Error(`Failed to fill monthly cost field with value: "${cost}".`);
    }
  }

  async selectAvailabilityStatus(status: string) {
    await selectAssetDropdown(this.page, '#select2-asset_availability_status-container', status);
  }

  async fillReceivedDate(date: string) {
    await this.page.locator('#asset_received_date').fill(date);
    try {
      await expect(this.page.locator('#asset_received_date')).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill received date field with value: "${date}".`);
    }
  }

  async fillLockingPeriod(period: string) {
    await this.page.locator('#asset_locking_period').clear();
    await this.page.locator('#asset_locking_period').fill(period);
    try {
      await expect(this.page.locator('#asset_locking_period')).toHaveValue(period);
    } catch {
      throw new Error(`Failed to fill locking period field with value: "${period}".`);
    }
  }

  async submit() {
    await this.page.locator('input[type="submit"][name="commit"][value="Save"]').click();
  }

  async assertNotCreated() {
    await this.page.waitForLoadState('networkidle');
    const successFlash = this.page
      .locator('#flashes')
      .filter({ hasText: 'Asset Created Successfully' });
    await expect(
      successFlash,
      'Asset was created without required fields — server-side validation was bypassed.'
    ).toHaveCount(0);
  }

  async verifySuccessAlert() {
    await expectFlashMessage(this.page, 'Asset Created Successfully', 'asset creation');
  }

  async verifyUpdateSuccessAlert() {
    await expectFlashMessage(this.page, 'Asset Updated Successfully', 'asset update');
  }

  // --- Search & edit ---

  async searchAsset(query: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(query);
  }

  async findAssetRow(query: string) {
    await filterTableBySearch(this.page, query);
    const row = this.page.locator('table tbody tr', { hasText: query }).first();
    try {
      await expect(row).toBeVisible();
    } catch {
      throw new Error(`Asset row not found for: "${query}".`);
    }
    return row;
  }

  async clickEditOnRow(query: string) {
    const row = await this.findAssetRow(query);
    await row.locator('a[href*="/edit"]').click();
    try {
      await expect(this.page).toHaveURL(/\/organisation_assets\/\d+\/edit/i);
    } catch {
      throw new Error(`Failed to navigate to edit page for asset: "${query}".`);
    }
  }

  async fillDiscontinueDate(date: string) {
    const field = this.page.locator('#asset_discontinue_date');
    try {
      await expect(field).toBeVisible();
    } catch {
      throw new Error('Discontinue date field not found on the asset form.');
    }
    await field.fill(date);
    try {
      await expect(field).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill discontinue date field with value: "${date}".`);
    }
  }
}
