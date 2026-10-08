import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import {
  selectAssetDropdown,
  filterTableBySearch,
  expectFlashMessage,
  selectRandomFromAssetDropdown,
  stripClientValidation,
} from '../../utils/test_helpers';

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

  // Picks a random asset from the maintenance asset dropdown (it only lists assets
  // eligible for maintenance) and returns its name.
  async selectRandomMaintenanceAsset(): Promise<string> {
    return selectRandomFromAssetDropdown(
      this.page,
      '#new_asset_maintainance > div.row.control-group > div:nth-child(1) > div > span > span.selection > span'
    );
  }

  async selectVendor(name: string) {
    await selectAssetDropdown(
      this.page,
      '#new_asset_maintainance > div.row.control-group > div:nth-child(2) > div > span > span.selection > span',
      name
    );
  }

  // Picks a random maintenance vendor and returns its name.
  async selectRandomVendor(): Promise<string> {
    return selectRandomFromAssetDropdown(
      this.page,
      '#new_asset_maintainance > div.row.control-group > div:nth-child(2) > div > span > span.selection > span'
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

  // See stripClientValidation() — lets a deliberately bad value reach the server.
  async disableClientValidation() {
    await stripClientValidation(this.page, { numbersToText: true });
  }

  async submit() {
    await this.page
      .locator('input[type="submit"][name="commit"][value="Save"].btn.btn-secondary.controls')
      .click();
  }

  async assertNotCreated() {
    await this.page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
    const successFlash = this.page
      .locator('#flashes')
      .filter({ hasText: 'Asset Maintainance Created Successfully' });
    await expect(
      successFlash,
      `Asset maintenance record was created despite invalid input — server-side validation was bypassed (now on ${new URL(this.page.url()).pathname}).`
    ).toHaveCount(0, { timeout: 15_000 });
  }

  // Stronger than assertNotCreated(): that only proves no success flash was on
  // screen, and flashes auto-dismiss, so on a slow run a record that WAS created
  // can look refused. The report lists every maintenance record, and reasons are
  // stamped unique per run, so this settles it either way. (The list table is not
  // used here — a brand new record is not reliably findable in it.)
  async expectMaintenanceAbsent(reason: string) {
    const response = await this.page.request.get('/asset_maintainances/download_report');
    // Guard the guard: if the report ever comes back as an error page rather than
    // a CSV, "the reason is not in it" would be true for the wrong reason and this
    // check would pass silently.
    expect(
      response.headers()['content-type'],
      'the maintenance report did not come back as a CSV, so its contents prove nothing'
    ).toContain('text/csv');
    expect(
      await response.text(),
      `The maintenance record "${reason}" was saved even though the submit should have been refused.`
    ).not.toContain(reason);
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
