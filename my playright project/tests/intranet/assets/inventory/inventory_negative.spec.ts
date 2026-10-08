import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';
import { createAsset, uniqueSerial } from './inventory_helpers';

/**
 * Inventory — negative cases.
 *
 * The positive specs only ever supply valid values, so nothing exercises the
 * rules that actually protect the inventory: a serial number identifies a
 * physical machine and has to be unique, and RAM / ROM / monthly cost /
 * locking period are all quantities that should refuse text and negatives.
 *
 * Each test submits exactly one bad value with everything else valid, so a
 * failure names the single field at fault.
 *
 * Every case strips the browser's own validation first — a pass that only means
 * Chrome refused to submit proves nothing, since that guard is bypassable with
 * devtools or a direct POST. The control test below proves the bypass still
 * submits a valid record, so a broken bypass cannot make these pass for free.
 */
test.describe('Inventory - negative cases', () => {

  test('control: a valid asset still saves with client validation removed', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.loginAs('admin');
    await inventoryPage.navigateTo();

    // Asserts the success flash, since expectRejected is not set. If this fails,
    // the bypass itself is broken and every case below is meaningless.
    await createAsset(inventoryPage, {
      serial: uniqueSerial('neg-control'),
      assetOf: 'Josh',
      bypassClientValidation: true,
    });
  });

  test('a duplicate serial number is rejected', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.loginAs('admin');
    await inventoryPage.navigateTo();

    // A serial number identifies one physical machine, so a second asset must
    // not be able to claim it.
    const serial = uniqueSerial('dup-serial');
    await createAsset(inventoryPage, { serial, assetOf: 'Josh' });

    await inventoryPage.navigateTo();
    await createAsset(inventoryPage, {
      serial,
      assetOf: 'Josh',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await inventoryPage.assertNotCreated();
  });

  // Each case asserts twice: no success flash, and — after going back to the
  // list — no row with that serial. The flash check alone cannot tell a refusal
  // apart from a slow redirect; the absence check settles it.
  const badQuantities: Array<{ what: string; cfg: Record<string, string> }> = [
    { what: 'non-numeric RAM', cfg: { ram: 'thirty two' } },
    { what: 'non-numeric ROM', cfg: { rom: 'five twelve' } },
    { what: 'a non-numeric monthly cost', cfg: { monthlyCost: 'free' } },
    { what: 'a non-numeric locking period', cfg: { lockingPeriod: 'a year' } },
    { what: 'a negative monthly cost', cfg: { monthlyCost: '-1200' } },
    { what: 'a negative locking period', cfg: { lockingPeriod: '-12' } },
    { what: 'a negative RAM value', cfg: { ram: '-32' } },
  ];

  for (const { what, cfg } of badQuantities) {
    test(`${what} is rejected`, async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.loginAs('admin');
      await inventoryPage.navigateTo();

      const serial = uniqueSerial('bad');
      await createAsset(inventoryPage, {
        serial,
        assetOf: 'Josh',
        ...cfg,
        expectRejected: true,
        bypassClientValidation: true,
      });
      await inventoryPage.assertNotCreated();
      await inventoryPage.expectAssetAbsent(serial);
    });
  }

  // Date range on the edit path: an asset cannot be taken out of service before
  // the company received it.
  //
  // CONFIRMED DEFECT (2026-09-28): the update saves and the asset moves to the
  // inactive report, dated a month before it was ever received. Nothing else in
  // the app compares these two dates. Marked test.fail() so the suite stays green
  // while the gap is open; it will report "unexpectedly passed" once a check is
  // added.
  test.fail('an asset cannot be discontinued before the date it was received', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.loginAs('admin');
    await inventoryPage.navigateTo();

    // The helper receives the asset on 2026-05-10.
    const serial = uniqueSerial('discontinue');
    await createAsset(inventoryPage, { serial, assetOf: 'Josh' });

    await page.goto('/organisation_assets');
    await inventoryPage.clickEditOnRow(serial);
    await inventoryPage.disableClientValidation();
    await inventoryPage.selectAvailabilityStatus('Discontinue');
    // A month BEFORE the asset was received.
    await inventoryPage.fillDiscontinueDate('2026-04-10');
    await inventoryPage.submit();

    await inventoryPage.assertNotUpdated();
    await inventoryPage.expectAssetStillInService(serial);
  });

  test('searching for an asset that does not exist shows an empty table', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.loginAs('admin');
    await inventoryPage.navigateTo();

    await inventoryPage.searchAsset(`no such asset ${Date.now()}`);
    await expect(page.locator('table tbody')).toContainText(/no matching records|no data/i);
  });
});
