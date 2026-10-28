import { test, expect } from '@playwright/test';
import { SubscriptionsPage } from '../pages/SubscriptionsPage';

// Client-side behaviour and validation of the Add Software Subscription form.
// Nothing here creates a record.
test.describe('Subscriptions - add form', () => {
  test.beforeEach(async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.loginAs('hr');
    await subs.navigateToInventory();
    await subs.clickAddSubscription();
  });

  test('defaults: Organization, 1 license, Monthly, USD, Credit Card, Active', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await expect(subs.field('category')).toHaveValue('');
    await expect(subs.field('license_type')).toHaveValue('Organization');
    await expect(subs.field('total_licenses')).toHaveValue('1');
    await expect(subs.field('billing_frequency')).toHaveValue('Monthly');
    await expect(subs.field('currency')).toHaveValue('USD');
    await expect(subs.field('payment_mode')).toHaveValue('Credit Card');
    await expect(subs.field('renewal_status')).toHaveValue('Active');
  });

  test('dropdowns offer the expected options', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    const options = (f: string) => subs.field(f).locator('option');
    await expect(options('category')).toHaveText([
      'Select Category', 'AI Tools', 'Development', 'Design', 'Cloud & Infra',
      'Productivity', 'HR & Compliance', 'Sales & Marketing', 'Other',
    ]);
    await expect(options('license_type')).toHaveText(['Organization', 'Individual']);
    await expect(options('billing_frequency')).toHaveText(['Monthly', 'Annual', 'Quarterly', 'One Time']);
    await expect(options('currency')).toHaveText(['USD', 'INR']);
    await expect(options('payment_mode')).toHaveText(['Credit Card', 'Invoice', 'Wire Transfer', 'Reimbursement']);
    await expect(options('renewal_status')).toHaveText([
      'Active', 'Auto-Renewing Active', 'Expiring Soon', 'Expired', 'Cancelled', 'One-Time Payment',
    ]);
  });

  // Annual Spend (INR) = spend x billing periods per year x the USD rate shown
  // on the page. The rate changes, so it is read from the page.
  test('Annual Spend (INR) is auto-calculated from spend, frequency and currency', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    // The rate is split across <strong> tags, so match on the page's flat text.
    const mainText = await page.locator('main').innerText();
    const rate = Number(mainText.match(/1\s*USD\s*[=≈]\s*₹\s*([\d.]+)/)![1]);

    const expectInr = async (expected: number) =>
      expect.poll(async () => Number(await subs.field('actual_spend_inr').inputValue()))
        .toBeCloseTo(expected, -1);

    await subs.field('spend_amount').fill('10');
    await expectInr(10 * 12 * rate);

    await subs.field('billing_frequency').selectOption('Quarterly');
    await expectInr(10 * 4 * rate);

    await subs.field('billing_frequency').selectOption('Annual');
    await expectInr(10 * rate);

    await subs.field('currency').selectOption('INR');
    await expectInr(10);
  });

  test('Software Name is required by the browser', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await expect(subs.field('name')).toHaveAttribute('required', /.*/);
    await subs.submitCreate();
    await expect(page).toHaveURL(/\/software_subscriptions\/new/);
    expect(await subs.field('name').evaluate((e: HTMLInputElement) => e.validity.valueMissing)).toBe(true);
  });

  test('server rejects a subscription without a Software Name', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.disableClientValidation();
    await subs.submitCreate();
    await subs.assertNotSaved();
  });

  test('Last 4 Digits only accepts exactly four digits', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    const last4 = subs.field('card_last_four_digits');
    // maxlength=4 stops a fifth digit from being typed at all.
    await last4.fill('12345');
    await expect(last4).toHaveValue('1234');
    for (const bad of ['12', 'abcd']) {
      await last4.fill(bad);
      expect(await last4.evaluate((e: HTMLInputElement) => e.validity.valid), `"${bad}" should be invalid`).toBe(false);
    }
    await last4.fill('4242');
    expect(await last4.evaluate((e: HTMLInputElement) => e.validity.valid)).toBe(true);
  });

  test('Total Purchased Licenses cannot go below 1', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await expect(subs.field('total_licenses')).toHaveAttribute('min', '1');
    await subs.field('total_licenses').fill('0');
    expect(await subs.field('total_licenses').evaluate((e: HTMLInputElement) => e.validity.rangeUnderflow)).toBe(true);
  });

  test('the back arrow returns to the inventory', async ({ page }) => {
    await page.locator('main a[href="/software_subscriptions"]').first().click();
    await expect(page).toHaveURL(/\/software_subscriptions(?:\?.*)?$/);
  });
});
