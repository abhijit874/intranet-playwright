import { test, expect } from '@playwright/test';
import { SubscriptionsPage } from '../pages/SubscriptionsPage';
import { createSubscription } from './subscription_helpers';
import { currentDateValue } from '../utils/test_helpers';

test.describe('Subscriptions - deactivate', () => {
  test.beforeEach(async ({ page }) => {
    await new SubscriptionsPage(page).loginAs('hr');
  });

  // Deactivates a subscription this test created, then checks it leaves the
  // active list but is still reachable under Show All.
  test('deactivate a subscription', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    const { id, name } = await createSubscription(subs);

    await subs.openSubscription(id);
    await subs.deactivate(currentDateValue());
    await expect(page.locator('.modal.show')).toHaveCount(0, { timeout: 15_000 });

    await subs.navigateToInventory();
    await subs.search(name);
    await expect(subs.inventoryTable().locator('tbody')).toContainText('No matching records found');

    await subs.showAllButton().click();
    await expect(page).toHaveURL(/all=all/);
    const row = await subs.findInventoryRow(name);
    await expect(row.locator('td').nth(12)).not.toHaveText(/^\s*Active\s*$/);
  });

  // Opens the modal on an existing subscription but never confirms it.
  test('deactivation date is mandatory', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.navigateToInventory();
    await subs.inventoryTable().locator('tbody tr td:nth-child(2) a').first().click();
    await page.locator('main a', { hasText: 'Deactivate Software' }).click();
    const modal = page.locator('.modal.show');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#deactivation_date')).toHaveAttribute('required', /.*/);
    await modal.locator('button', { hasText: 'Confirm Deactivation' }).click();
    // The browser blocks the empty submit, so the modal stays open.
    await expect(modal).toBeVisible();
    expect(
      await modal.locator('#deactivation_date').evaluate((e: HTMLInputElement) => e.validity.valueMissing)
    ).toBe(true);
    await modal.locator('button', { hasText: 'Cancel' }).click();
  });
});
