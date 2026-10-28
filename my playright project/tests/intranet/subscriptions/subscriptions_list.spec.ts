import { test, expect } from '@playwright/test';
import { INVENTORY_COLUMNS, ALLOCATION_COLUMNS, SubscriptionsPage } from '../pages/SubscriptionsPage';

// Read-only checks of the two Subscriptions lists as HR.
test.describe('Subscriptions - lists', () => {
  test.beforeEach(async ({ page }) => {
    await new SubscriptionsPage(page).loginAs('hr');
  });

  test('the Subscriptions nav group holds Inventory and Allocations', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await expect(subs.navGroup()).toBeVisible();
    await expect(subs.inventoryNavLink()).toHaveText('Inventory');
    await expect(subs.allocationsNavLink()).toHaveText('Allocations');
  });

  test('inventory opens on active subscriptions with the expected columns', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.navigateToInventory();
    await expect(page.locator('main')).toContainText('Showing active subscriptions only.');
    await expect(subs.inventoryTable().locator('thead th')).toHaveText(INVENTORY_COLUMNS);
    await expect(subs.inventoryTable().locator('tbody tr').first()).toBeVisible();
    // Active-only view: every Status cell says some flavour of "Active".
    const statuses = await subs.inventoryTable().locator('tbody tr td:nth-child(13)').allTextContents();
    for (const s of statuses) expect(s.trim()).toMatch(/Active/);
  });

  test('inventory exposes Add, CSV upload, report download and a month spend filter', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.navigateToInventory();
    await expect(page.locator('a.btn[href="/software_subscriptions/new"]')).toHaveText('Add Subscription');
    await expect(page.locator('a[data-bs-target="#upload_software_subscriptions_modal"]')).toHaveCount(1);
    await expect(page.locator('a[href="/software_subscriptions/download_sample"]')).toHaveCount(1);
    await expect(page.locator('a[href*="download_report?report_type=active"]')).toHaveText('Active Subscriptions');
    await expect(page.locator('a[href*="download_report?report_type=inactive"]')).toHaveText('Inactive Subscriptions');
    const month = page.locator('select#month');
    await expect(month.locator('option').first()).toHaveText('Current Spend (All Active)');
    // Twelve trailing months follow the "current" option.
    await expect(month.locator('option')).toHaveCount(13);
  });

  test('Show All switches the inventory to include inactive subscriptions', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.navigateToInventory();
    await subs.showAllButton().click();
    await expect(page).toHaveURL(/\/software_subscriptions\?all=all/);
    await expect(page.locator('main')).not.toContainText('Showing active subscriptions only.');
  });

  test('inventory search narrows the table to the matching software', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.navigateToInventory();
    const firstName = (await subs.inventoryTable().locator('tbody tr td:nth-child(2)').first().textContent())!.trim();
    await subs.search(firstName);
    const names = await subs.inventoryTable().locator('tbody tr td:nth-child(2)').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(n.trim().toLowerCase()).toContain(firstName.toLowerCase());
  });

  test('a software name links to its detail page', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.navigateToInventory();
    const link = subs.inventoryTable().locator('tbody tr td:nth-child(2) a').first();
    const name = (await link.textContent())!.trim();
    await link.click();
    await expect(page).toHaveURL(/\/software_subscriptions\/\d+$/);
    await expect(page.locator('main')).toContainText(name);
    await expect(subs.licenseQuota()).toBeVisible();
    await expect(page.locator('main')).toContainText('Active Seat Allocations');
    await expect(page.locator('main')).toContainText('Provisioned License Seats');
  });

  test('allocations list opens on active allocations with the expected columns', async ({ page }) => {
    const subs = new SubscriptionsPage(page);
    await subs.navigateToAllocations();
    await expect(page.locator('main')).toContainText('Showing active allocations only.');
    await expect(subs.allocationsTable().locator('thead th')).toHaveText(ALLOCATION_COLUMNS);
    await expect(page.locator('a.btn[href="/software_allocations/new"]')).toHaveText('Allocate License');
    await expect(page.locator('a[href="/software_allocations/download_report"]')).toHaveText('Software Allocations Report');
  });
});
