import { test, expect } from '@playwright/test';
import { SubscriptionsPage } from '../pages/SubscriptionsPage';
import { createSubscription, uniqueSubscriptionName } from './subscription_helpers';

test.describe('Subscriptions - add and edit', () => {
  test.beforeEach(async ({ page }) => {
    await new SubscriptionsPage(page).loginAs('hr');
  });

  // Creates a 2-seat Organization subscription and checks the detail page, the
  // auto-provisioned seats and the inventory row all reflect what was entered.
  test('add an Organization subscription', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    const { id, name, input } = await createSubscription(subs);

    await subs.openSubscription(id);
    const main = page.locator('main');
    await expect(main).toContainText(input.category!);
    await expect(main).toContainText('Organization');
    await expect(main).toContainText('Monthly');
    await expect(main).toContainText(input.cardHolder!);
    await expect(main).toContainText(input.cardLast4!);
    await expect(subs.licenseQuota()).toHaveText(/0 allocated \/ 2 total \(2 available\)/);
    await expect(main).toContainText('No active allocations for this tool.');

    // One seat per purchased license, IDs derived from the upper-cased name.
    await expect(main).toContainText('Provisioned License Seats (2 Total)');
    await expect(subs.seatRows()).toHaveCount(2);
    await expect(subs.seatRows().nth(0)).toContainText(`${name.toUpperCase()}-001`);
    await expect(subs.seatRows().nth(1)).toContainText(`${name.toUpperCase()}-002`);

    await subs.navigateToInventory();
    const row = await subs.findInventoryRow(name);
    const cells = row.locator('td');
    await expect(cells.nth(2)).toHaveText('Organization');
    await expect(cells.nth(4)).toHaveText('USD');
    await expect(cells.nth(5)).toHaveText('Monthly');
    await expect(cells.nth(6)).toHaveText('2');
    await expect(cells.nth(7)).toHaveText('0');
    await expect(cells.nth(8)).toHaveText('Credit Card');
    await expect(cells.nth(10)).toHaveText('4242');
    await expect(cells.nth(12)).toContainText('Active');
  });

  // Individual licenses are 1:1 and non-transferable, so the form pins the seat
  // count to a read-only 1.
  test('add an Individual subscription - seat count is locked to 1', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.navigateToInventory();
    await subs.clickAddSubscription();
    await subs.field('license_type').selectOption('Individual');
    await expect(subs.field('total_licenses')).toHaveValue('1');
    await expect(subs.field('total_licenses')).toHaveJSProperty('readOnly', true);

    // Switching back to Organization releases the field again.
    await subs.field('license_type').selectOption('Organization');
    await expect(subs.field('total_licenses')).toHaveJSProperty('readOnly', false);

    const name = uniqueSubscriptionName('PW-Sub-Ind');
    await subs.fillForm({
      name,
      licenseType: 'Individual',
      billingFrequency: 'Annual',
      currency: 'INR',
      spendAmount: 1200,
      paymentMode: 'Invoice',
    });
    await subs.submitCreate();
    await subs.assertSaved('Created');

    const row = await subs.findInventoryRow(name);
    await expect(row.locator('td').nth(2)).toHaveText('Individual');
    await expect(row.locator('td').nth(6)).toHaveText('1');
    await subs.openSubscription(await subs.idOf(name));
    await expect(subs.licenseQuota()).toHaveText(/0 allocated \/ 1 total/);
  });

  // Edits a subscription this test created (not a real one) and checks the
  // change sticks.
  test('edit a subscription', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    const { id, name } = await createSubscription(subs);

    await subs.openSubscription(id);
    await subs.clickEditSubscription();
    await expect(subs.field('name')).toHaveValue(name);
    await subs.field('category').selectOption('AI Tools');
    await subs.field('total_licenses').fill('3');
    await subs.field('card_holder_name').fill('Edited Tester');
    await subs.submitCreate();
    await subs.assertSaved('Updated');

    await subs.openSubscription(id);
    await expect(page.locator('main')).toContainText('AI Tools');
    await expect(page.locator('main')).toContainText('Edited Tester');
    await expect(subs.licenseQuota()).toHaveText(/0 allocated \/ 3 total/);
  });
});
