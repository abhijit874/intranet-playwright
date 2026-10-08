import * as path from 'path';
import { test, expect } from '@playwright/test';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';
import { createMaintenance, uniqueReason } from './maintenance_helpers';

const NOT_AN_IMAGE = path.resolve(__dirname, '../../../fixtures/not-an-image.txt');

/**
 * Asset maintenance — negative cases.
 *
 * A maintenance record carries a date range that has to make sense, a cost that
 * has to be a number, and a photo of the asset. The positive specs supply all of
 * them correctly, so a dropped check would go unnoticed.
 *
 * Each test does exactly one wrong thing, with the browser's own validation
 * stripped first so the server is what answers. The control test proves that
 * bypass still submits a valid record.
 */
test.describe('Asset maintenance - negative cases', () => {

  test('control: a valid maintenance record still saves with client validation removed', async ({ page }) => {
    const maintenancePage = new MaintenancePage(page);
    await maintenancePage.loginAs('admin');
    await maintenancePage.navigateTo();

    // Asserts the success flash, since expectRejected is not set.
    await createMaintenance(maintenancePage, {
      reason: uniqueReason('bypass control'),
      bypassClientValidation: true,
    });
  });

  test('an end date before the from date is rejected', async ({ page }) => {
    const maintenancePage = new MaintenancePage(page);
    await maintenancePage.loginAs('admin');
    await maintenancePage.navigateTo();

    const reason = uniqueReason('end before start');
    await createMaintenance(maintenancePage, {
      reason,
      fromDate: '2026-06-01',
      endDate: '2026-05-10',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await maintenancePage.assertNotCreated();
    await maintenancePage.expectMaintenanceAbsent(reason);
  });

  test('a non-numeric maintenance cost is rejected', async ({ page }) => {
    const maintenancePage = new MaintenancePage(page);
    await maintenancePage.loginAs('admin');
    await maintenancePage.navigateTo();

    const reason = uniqueReason('bad cost');
    await createMaintenance(maintenancePage, {
      reason,
      cost: 'free of charge',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await maintenancePage.assertNotCreated();
    await maintenancePage.expectMaintenanceAbsent(reason);
  });

  test('a negative maintenance cost is rejected', async ({ page }) => {
    const maintenancePage = new MaintenancePage(page);
    await maintenancePage.loginAs('admin');
    await maintenancePage.navigateTo();

    const reason = uniqueReason('negative cost');
    await createMaintenance(maintenancePage, {
      reason,
      cost: '-1200',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await maintenancePage.assertNotCreated();
    await maintenancePage.expectMaintenanceAbsent(reason);
  });

  // The form asks for a photo of the asset; this asks whether it checks that it
  // got one. A programmatic upload ignores accept="", which is the same position
  // anyone posting directly is in.
  // DEFECT (2026-09-24): the record saves with a plain text file stored as the
  // asset image. Unlike the project form — which refuses a non-image for its
  // logo and image fields — this input carries no accept filter and the server
  // checks nothing, so the field named "Asset image" will hold any file at all.
  // Marked test.fail() so the suite stays green while the gap is open; it will
  // report "unexpectedly passed" once a check is added.
  test.fail('a non-image file is rejected as the asset image', async ({ page }) => {
    const maintenancePage = new MaintenancePage(page);
    await maintenancePage.loginAs('admin');
    await maintenancePage.navigateTo();

    const reason = uniqueReason('bad image');
    await createMaintenance(maintenancePage, {
      reason,
      imagePath: NOT_AN_IMAGE,
      expectRejected: true,
      bypassClientValidation: true,
    });
    await maintenancePage.assertNotCreated();
    await maintenancePage.expectMaintenanceAbsent(reason);
  });

  test('searching for a maintenance record that does not exist shows an empty table', async ({ page }) => {
    const maintenancePage = new MaintenancePage(page);
    await maintenancePage.loginAs('admin');
    await maintenancePage.navigateTo();

    await maintenancePage.searchMaintenance(`no such maintenance ${Date.now()}`);
    await expect(page.locator('table tbody')).toContainText(/no matching records|no data/i);
  });
});
