import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import {
  selectAssetDropdown,
  filterTableBySearch,
  expectFlashMessage,
  selectRandomOption,
} from '../../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin';

export class AssetAllocationPage {
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

  async clickAddAssetAllocation() {
    await this.page
      .locator('a.btn.btn-secondary[data-turbo="false"][href="/asset_allocations/new"]', {
        hasText: 'Add Asset Allocation',
      })
      .click();
    try {
      await expect(this.page).toHaveURL(/\/asset_allocations\/new/i);
    } catch {
      throw new Error('Failed to navigate to Add Asset Allocation page.');
    }
  }

  async selectAsset(name: string) {
    await selectAssetDropdown(this.page, '#select2-asset_allocation_asset_id-container', name);
  }

  async selectUser(name: string) {
    await selectAssetDropdown(this.page, '#select2-asset_allocation_user_id-container', name);
  }

  // Picks a random user from the allocation user dropdown and returns their
  // "Name(email)" label, so allocations spread across employees.
  async selectRandomUser(): Promise<string> {
    return selectRandomOption(this.page, '#asset_allocation_user_id');
  }

  // Picks a random allocatable asset and returns its "Name (SERIAL)" label. The
  // dropdown only lists assets that can be allocated, so any of them is valid.
  async selectRandomAsset(): Promise<string> {
    return selectRandomOption(this.page, '#asset_allocation_asset_id');
  }

  async selectAllocatedFrom(location: string) {
    await selectAssetDropdown(this.page, '#select2-asset_allocation_allocated_from-container', location);
  }

  async fillPurpose(purpose: string) {
    await this.page.locator('#asset_allocation_purpose').fill(purpose);
    try {
      await expect(this.page.locator('#asset_allocation_purpose')).toHaveValue(purpose);
    } catch {
      throw new Error(`Failed to fill purpose field with value: "${purpose}".`);
    }
  }

  async fillIssuedDate(date: string) {
    await this.page.locator('#asset_allocation_issued_date').fill(date);
    try {
      await expect(this.page.locator('#asset_allocation_issued_date')).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill issued date field with value: "${date}".`);
    }
  }

  async submit() {
    await this.page
      .locator('input[type="submit"][name="commit"][value="Save"].btn.btn-secondary.controls')
      .click();
  }

  async assertNotAllocated() {
    await this.page.waitForLoadState('networkidle');
    const successFlash = this.page
      .locator('#flashes')
      .filter({ hasText: 'Asset has been allocated successfully' });
    await expect(
      successFlash,
      'Asset was allocated without required fields — server-side validation was bypassed.'
    ).toHaveCount(0);
  }

  async verifySuccessAlert() {
    await expectFlashMessage(this.page, 'Asset has been allocated successfully ! ! !', 'allocation');
  }

  async verifyUpdateSuccessAlert() {
    await expectFlashMessage(this.page, 'Asset Allocation Updated Successfully', 'allocation update');
  }

  // --- Search & edit ---

  async searchAllocation(query: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(query);
  }

  async findAllocationRow(query: string) {
    await filterTableBySearch(this.page, query);
    const row = this.page.locator('table tbody tr', { hasText: query }).first();
    try {
      await expect(row).toBeVisible();
    } catch {
      throw new Error(`Asset allocation row not found for: "${query}".`);
    }
    return row;
  }

  async clickEditOnRow(query: string) {
    const row = await this.findAllocationRow(query);
    await row.locator('a[href*="/edit"]').click();
    try {
      await expect(this.page).toHaveURL(/\/asset_allocations\/\d+\/edit/i);
    } catch {
      throw new Error(`Failed to navigate to edit page for allocation: "${query}".`);
    }
  }

  // Opens the edit form for the currently-active allocation of an asset — the row
  // whose "Asset received to Admin?" cell reads "No". An asset has at most one
  // active allocation per serial; historical allocations show "Yes" plus a
  // deallocation date. Targeting the active row avoids accidentally editing an
  // old record when the asset has allocation history.
  async openActiveAllocationForEdit(serial: string) {
    await filterTableBySearch(this.page, serial);
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: serial })
      .filter({ has: this.page.getByText('No', { exact: true }) })
      .first();
    try {
      await expect(row).toBeVisible();
    } catch {
      throw new Error(`Active (un-received) allocation row not found for serial: "${serial}".`);
    }
    await row.locator('a[href*="/edit"]').click();
    try {
      await expect(this.page).toHaveURL(/\/asset_allocations\/\d+\/edit/i);
    } catch {
      throw new Error(`Failed to navigate to edit page for active allocation: "${serial}".`);
    }
  }

  async markAsReceived() {
    const toggle = this.page.locator('#asset_allocation_is_asset_received');
    await toggle.check();
    try {
      await expect(toggle).toBeChecked();
    } catch {
      throw new Error('"Is asset received" toggle could not be checked.');
    }
  }

  async fillReceivedDate(date: string) {
    await this.page.locator('#asset_allocation_received_date').fill(date);
    try {
      await expect(this.page.locator('#asset_allocation_received_date')).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill received date field with value: "${date}".`);
    }
  }
}
