import { test, expect } from '@playwright/test';
import { SubscriptionsPage } from '../pages/SubscriptionsPage';
import { createSubscription } from './subscription_helpers';
import { currentDateValue } from '../utils/test_helpers';

// "Test User" is the staging test account, so it is safe to hand seats to.
const EMPLOYEE = 'Test User';

test.describe('Subscriptions - license allocation', () => {
  test.beforeEach(async ({ page }) => {
    await new SubscriptionsPage(page).loginAs('hr');
  });

  // Allocates one seat of a fresh 2-seat subscription and checks the quota,
  // the subscription's allocation table and the Allocations list all agree.
  // Leaves one active seat on Test User against this run's throwaway subscription.
  test('allocate a license seat to an employee', async ({ page }) => {
    test.setTimeout(240_000);
    const subs = new SubscriptionsPage(page);
    const { id, name } = await createSubscription(subs);

    await subs.openSubscription(id);
    await subs.clickAllocateSeat(id);
    // Arriving from the subscription preselects it.
    await expect(subs.allocationField('software_subscription_id')).toHaveValue(String(id));
    await expect(subs.allocationField('issued_date')).toHaveValue(currentDateValue());
    await subs.selectEmployee(EMPLOYEE);
    await subs.submitAllocation();

    await subs.assertAllocationSaved();
    await subs.openSubscription(id);
    await expect(subs.licenseQuota()).toHaveText(/1 allocated \/ 2 total \(1 available\)/);
    await expect(subs.activeAllocationsTable()).toContainText(EMPLOYEE);
    await expect(subs.activeAllocationsTable()).toContainText(`${name.toUpperCase()}-001`);

    await subs.navigateToAllocations();
    await subs.search(name);
    const row = subs.allocationsTable().locator('tbody tr', { hasText: name });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(EMPLOYEE);
    await expect(row.locator('td').nth(15)).toContainText('Active');

    // A subscription with a live seat cannot be deactivated: the modal swaps the
    // date field for a refusal.
    await subs.openSubscription(id);
    await page.locator('main a', { hasText: 'Deactivate Software' }).click();
    const modal = page.locator('.modal.show');
    await expect(modal).toContainText(
      'Cannot deactivate this software because it has 1 active seat allocation(s). ' +
      'Please deactivate all active seat allocations first.'
    );
    await expect(modal.locator('#deactivation_date')).toHaveCount(0);
    await modal.locator('button', { hasText: 'Close' }).click();
  });

  test('employee, software and start date are required to allocate', async ({ page }) => {
    test.setTimeout(120_000);
    const subs = new SubscriptionsPage(page);
    await subs.openAllocationForm();
    for (const f of ['user_id', 'software_subscription_id', 'issued_date']) {
      await expect(subs.allocationField(f)).toHaveAttribute('required', /.*/);
    }
    await subs.submitAllocation();
    await expect(page).toHaveURL(/\/software_allocations\/new/);
  });
});
