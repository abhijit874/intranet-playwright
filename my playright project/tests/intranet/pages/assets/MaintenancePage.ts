import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import { selectAssetDropdown, filterTableBySearch, expectFlashMessage } from '../../utils/test_helpers';

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

  // Picks the first genuinely-available asset from the maintenance asset dropdown
  // (skipping the empty placeholder) and returns its name. Used so create-then-edit
  // tests don't depend on a specific asset that gets consumed once it's in
  // maintenance and removed from the list.
  async selectFirstAvailableMaintenanceAsset(): Promise<string> {
    const container = this.page.locator(
      '#new_asset_maintainance > div.row.control-group > div:nth-child(1) > div > span > span.selection > span'
    );
    await container.click();
    const option = this.page
      .getByRole('option')
      .filter({ hasText: /\S/ })
      .filter({ hasNotText: /^\s*select/i })
      .first();
    const name = ((await option.textContent()) ?? '').trim();
    await option.click();
    return name;
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
    try {
      await expect(this.page.locator('#asset_maintainance_maintainance_cost')).toHaveValue(cost);
    } catch {
      throw new Error(`Failed to fill maintenance cost field with value: "${cost}".`);
    }
  }

  async fillReason(reason: string) {
    await this.page.locator('#asset_maintainance_reason').fill(reason);
    try {
      await expect(this.page.locator('#asset_maintainance_reason')).toHaveValue(reason);
    } catch {
      throw new Error(`Failed to fill maintenance reason field with value: "${reason}".`);
    }
  }

  async fillFromDate(date: string) {
    await this.page.locator('#asset_maintainance_from_date').fill(date);
    try {
      await expect(this.page.locator('#asset_maintainance_from_date')).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill maintenance from date field with value: "${date}".`);
    }
  }

  async fillEndDate(date: string) {
    await this.page.locator('#asset_maintainance_end_date').fill(date);
    try {
      await expect(this.page.locator('#asset_maintainance_end_date')).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill maintenance end date field with value: "${date}".`);
    }
  }

  async uploadImage(filePath: string) {
    await this.page.locator('#asset_maintainance_asset_image').setInputFiles(filePath);
  }

  async submit() {
    await this.page
      .locator('input[type="submit"][name="commit"][value="Save"].btn.btn-secondary.controls')
      .click();
  }

  async assertNotCreated() {
    await this.page.waitForLoadState('networkidle');
    const successFlash = this.page
      .locator('#flashes')
      .filter({ hasText: 'Asset Maintainance Created Successfully' });
    await expect(
      successFlash,
      'Asset maintenance record was created without required fields — server-side validation was bypassed.'
    ).toHaveCount(0);
  }

  async verifySuccessAlert() {
    await expectFlashMessage(this.page, 'Asset Maintainance Created Successfully !!!', 'maintenance creation');
  }

  async verifyUpdateSuccessAlert() {
    await expectFlashMessage(this.page, 'Asset Maintainance Updated Successfully !!!', 'maintenance update');
  }

  // --- Search & edit ---

  async searchMaintenance(query: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(query);
  }

  async findMaintenanceRow(query: string) {
    await filterTableBySearch(this.page, query);
    const row = this.page.locator('table tbody tr', { hasText: query }).first();
    try {
      await expect(row).toBeVisible();
    } catch {
      throw new Error(`Maintenance row not found for: "${query}".`);
    }
    return row;
  }

  async clickEditOnRow(query: string) {
    const row = await this.findMaintenanceRow(query);
    await row.locator('a[href*="/edit"]').click();
  }

  async markAsReceived() {
    const toggle = this.page.locator('#asset_maintainance_is_asset_received');
    await toggle.check();
    try {
      await expect(toggle).toBeChecked();
    } catch {
      throw new Error('"Is asset received" toggle could not be checked.');
    }
  }
}
