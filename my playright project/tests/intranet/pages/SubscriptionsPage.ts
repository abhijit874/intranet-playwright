import { expect, Locator, Page } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectFlashMessage, filterTableBySearch, selectFromSingleSelect2 } from '../utils/test_helpers';

// Subscriptions module = two pages under the "Subscriptions" nav group:
//   Inventory   (/software_subscriptions) — the software products the company pays for
//   Allocations (/software_allocations)   — license seats handed to employees
// Both lists default to ACTIVE records only; "Show All" adds ?all=all.

export const INVENTORY_COLUMNS = [
  '#', 'Software Name', 'License Type', 'Spend Amount', 'Currency', 'Billing Frequency',
  'Total Licenses', 'Allocated Licenses', 'Payment Mode', 'Card Holder',
  'Card Last 4 Digits', 'Renewal Date', 'Status', 'Action',
];

export const ALLOCATION_COLUMNS = [
  '#', 'Employee ID', 'Employee Name', 'Employee Status', 'PID', 'Project Name',
  'Software Name', 'License ID', 'Spend (INR)', 'Spend (USD)', 'Billing Frequency',
  'Card Holder', 'Card Last 4 Digits', 'Start Date', 'Next Billing Date', 'Status',
  'Total Spend (INR)', 'Action',
];

export interface SubscriptionInput {
  name: string;
  category?: string;
  licenseType?: 'Organization' | 'Individual';
  totalLicenses?: number;
  billingFrequency?: 'Monthly' | 'Annual' | 'Quarterly' | 'One Time';
  currency?: 'USD' | 'INR';
  spendAmount?: number;
  paymentMode?: 'Credit Card' | 'Invoice' | 'Wire Transfer' | 'Reimbursement';
  cardHolder?: string;
  cardLast4?: string;
  renewalDate?: string;
}

export class SubscriptionsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'hr') {
    await login(this.page, user);
  }

  // --- Navigation ---

  navGroup(): Locator {
    return this.page.locator('a.nav-link[href="#softwareMenu"]', { hasText: 'Subscriptions' });
  }

  inventoryNavLink(): Locator {
    return this.page.locator('a.nav-link[href="/software_subscriptions"]');
  }

  allocationsNavLink(): Locator {
    return this.page.locator('a.nav-link[href="/software_allocations"]');
  }

  // The Inventory/Allocations links live in a collapsed group; expand it first
  // when it isn't already open.
  private async openNavItem(link: Locator) {
    if (!(await link.isVisible())) await this.navGroup().click();
    await link.click();
  }

  async navigateToInventory() {
    await this.openNavItem(this.inventoryNavLink());
    try {
      await expect(this.page).toHaveURL(/\/software_subscriptions(?:\?.*)?$/);
    } catch {
      throw new Error('Failed to navigate to the Software Inventory page.');
    }
    await expect(this.page.getByRole('heading', { name: 'Software Inventory' })).toBeVisible();
  }

  async navigateToAllocations() {
    await this.openNavItem(this.allocationsNavLink());
    try {
      await expect(this.page).toHaveURL(/\/software_allocations(?:\?.*)?$/);
    } catch {
      throw new Error('Failed to navigate to the Software Allocations page.');
    }
    await expect(this.page.getByRole('heading', { name: 'Software Allocations' })).toBeVisible();
  }

  // --- Inventory list ---

  inventoryTable(): Locator {
    return this.page.locator('#software-subscriptions-table');
  }

  allocationsTable(): Locator {
    return this.page.locator('#software-allocations-table');
  }

  showAllButton(): Locator {
    return this.page.locator('#show_btn');
  }

  async search(term: string) {
    await filterTableBySearch(this.page, term);
  }

  async findInventoryRow(name: string): Promise<Locator> {
    await this.search(name);
    const row = this.inventoryTable().locator('tbody tr', {
      has: this.page.locator('td:nth-child(2) a', { hasText: new RegExp(`^${escapeRegex(name)}$`) }),
    });
    try {
      await expect(row).toHaveCount(1, { timeout: 15_000 });
    } catch {
      throw new Error(`Subscription row not found in the inventory list for: "${name}".`);
    }
    return row;
  }

  // --- Add / edit form ---

  async clickAddSubscription() {
    await this.page.locator('a.btn[href="/software_subscriptions/new"]', { hasText: 'Add Subscription' }).click();
    try {
      await expect(this.page).toHaveURL(/\/software_subscriptions\/new/);
    } catch {
      throw new Error('Failed to open the Add Software Subscription form.');
    }
    await expect(this.page.getByRole('heading', { name: 'Add Software Subscription' })).toBeVisible();
  }

  field(name: string): Locator {
    return this.page.locator(`#software_subscription_${name}`);
  }

  async fillForm(input: SubscriptionInput) {
    await this.field('name').fill(input.name);
    if (input.category) await this.field('category').selectOption(input.category);
    if (input.licenseType) await this.field('license_type').selectOption(input.licenseType);
    // Individual locks Total Licenses to a read-only 1, so only set it for Organization.
    if (input.totalLicenses !== undefined && input.licenseType !== 'Individual') {
      await this.field('total_licenses').fill(String(input.totalLicenses));
    }
    if (input.billingFrequency) await this.field('billing_frequency').selectOption(input.billingFrequency);
    if (input.currency) await this.field('currency').selectOption(input.currency);
    if (input.spendAmount !== undefined) await this.field('spend_amount').fill(String(input.spendAmount));
    if (input.paymentMode) await this.field('payment_mode').selectOption(input.paymentMode);
    if (input.cardHolder) await this.field('card_holder_name').fill(input.cardHolder);
    if (input.cardLast4) await this.field('card_last_four_digits').fill(input.cardLast4);
    if (input.renewalDate) await this.field('renewal_date').fill(input.renewalDate);
  }

  async submitCreate() {
    await this.page.locator('input[type="submit"][name="commit"]').click();
  }

  // Same bypass the vendor specs use: lets a bad value reach the server so the
  // server's validation is what gets tested, not Chrome's.
  async disableClientValidation() {
    await this.page.evaluate(() => {
      document.querySelectorAll('form').forEach((f) => ((f as HTMLFormElement).noValidate = true));
      document.querySelectorAll('[required]').forEach((e) => e.removeAttribute('required'));
      document.querySelectorAll('[pattern]').forEach((e) => e.removeAttribute('pattern'));
    });
  }

  // A successful create or update redirects back to the inventory list with an
  // alert-info flash ("Software Subscription Created Successfully" / "...Updated...").
  async assertSaved(action: 'Created' | 'Updated') {
    try {
      await expectFlashMessage(this.page, `Software Subscription ${action} Successfully`, `subscription ${action.toLowerCase()}`, 20_000);
    } catch (e) {
      const errors = (await this.page.locator('.invalid-feedback, .alert-danger').allTextContents())
        .map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
      throw new Error(`${(e as Error).message}${errors.length ? ` Field errors: ${errors.join(' | ')}` : ''}`);
    }
    await expect(this.page).toHaveURL(/\/software_subscriptions(?:\?.*)?$/);
  }

  // Finds the subscription in the inventory list and returns its id (from the
  // name link) so the caller can open its detail page directly.
  async idOf(name: string): Promise<number> {
    const row = await this.findInventoryRow(name);
    const href = await row.locator('td:nth-child(2) a').getAttribute('href');
    return Number(href!.match(/\/software_subscriptions\/(\d+)/)![1]);
  }

  async assertNotSaved() {
    await this.page.waitForLoadState('networkidle');
    await expect(
      this.page,
      'Subscription was saved without its required fields — server-side validation was bypassed.'
    ).toHaveURL(/\/software_subscriptions(\/new)?$/);
    await expect(this.page.locator('#flashes')).not.toContainText('Created Successfully');
  }

  // --- Show page ---

  async openSubscription(id: number) {
    await this.page.goto(`/software_subscriptions/${id}`);
    await expect(this.licenseQuota()).toBeVisible();
  }

  // "0 allocated / 2 total (2 available)"
  licenseQuota(): Locator {
    return this.page.locator('main').getByText(/\d+ allocated \/ \d+ total/);
  }

  seatRows(): Locator {
    return this.page.locator('main table').nth(1).locator('tbody tr');
  }

  activeAllocationsTable(): Locator {
    return this.page.locator('main table').first();
  }

  async clickEditSubscription() {
    await this.page.locator('main a', { hasText: 'Edit Subscription' }).click();
    await expect(this.page).toHaveURL(/\/software_subscriptions\/\d+\/edit/);
  }

  async deactivate(date: string) {
    await this.page.locator('main a', { hasText: 'Deactivate Software' }).click();
    // Bootstrap modals keep aria-hidden while shown, so target `.modal.show`.
    const modal = this.page.locator('.modal.show');
    await expect(modal).toBeVisible();
    await modal.locator('#deactivation_date').fill(date);
    await modal.locator('button', { hasText: 'Confirm Deactivation' }).click();
  }

  // --- Allocations ---

  // The allocation form carries every employee and product in its dropdowns and
  // its `load` event can take well over the click timeout on staging, so open it
  // by URL and only wait for the DOM.
  async openAllocationForm(subscriptionId?: number) {
    const query = subscriptionId ? `?subscription_id=${subscriptionId}` : '';
    await this.page.goto(`/software_allocations/new${query}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(this.page.getByRole('heading', { name: 'Allocate Software License' })).toBeVisible({ timeout: 30_000 });
  }

  // "+ Allocate Seat" on the detail page points at the form with the
  // subscription preselected.
  async clickAllocateSeat(subscriptionId: number) {
    await expect(this.page.locator('main a', { hasText: '+ Allocate Seat' }))
      .toHaveAttribute('href', `/software_allocations/new?subscription_id=${subscriptionId}`);
    await this.openAllocationForm(subscriptionId);
  }

  allocationField(name: string): Locator {
    return this.page.locator(`#software_allocation_${name}`);
  }

  async selectEmployee(name: string) {
    await selectFromSingleSelect2(this.page, '#select2-software_allocation_user_id-container', name);
  }

  async submitAllocation() {
    await this.page.locator('main form').getByRole('button', { name: 'Allocate License' }).click();
  }

  // The save itself is quick, but the redirect off the heavy form takes well
  // over 20s on staging.
  async assertAllocationSaved() {
    try {
      await expect(this.page).not.toHaveURL(/\/software_allocations\/new/, { timeout: 90_000 });
    } catch {
      throw new Error('Allocation was not saved — the form never redirected away from /software_allocations/new.');
    }
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
