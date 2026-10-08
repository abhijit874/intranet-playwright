import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import { InventoryReportsPage } from '../../pages/assets/InventoryReportsPage';
import { InventoryPage } from '../../pages/assets/InventoryPage';
import { readCsvRecords } from '../../utils/csv_report_filter';
import { createAsset, uniqueSerial } from './inventory_helpers';
import { login } from '../../utils/login_helper';

/**
 * Inventory reports — content and access.
 *
 * The existing specs prove a file comes back. They do not look inside it, so the
 * whole point of the Active / Inactive split — that each asset appears in
 * exactly one of the two, according to its status — is untested. A report that
 * downloads successfully but lists a discontinued machine as active is worse
 * than one that fails outright: nothing surfaces the mistake.
 *
 * Statuses as they stand on staging (2026-09-24):
 *   active   — In Stock, Allocated
 *   inactive — Discontinue, Returned to Vendor, Maintainance, Out of service,
 *              Returned to Client
 * The tests derive the split from "an asset is in exactly one report" and from
 * the active side's two statuses, rather than pinning the inactive list, which
 * is the side likely to grow.
 */

const downloadDir = path.resolve(__dirname, '../../../../test-results/inventory-reports');

const IN_SERVICE = ['In Stock', 'Allocated'];

const EXPECTED_COLUMNS = [
  'Model',
  'Asset Type',
  'Category',
  'Hardware Type',
  'Serial Number',
  'OS',
  'RAM',
  'ROM',
  'Status',
  'Owner',
  'Location',
  'Processor',
  'Manufacturing Company',
  'Received Date',
  'Locked Until',
  'Monthly Cost',
  'Renewal Date',
  'Return Date',
];

async function downloadRows(page: Page, type: 'active' | 'inactive') {
  const reportsPage = new InventoryReportsPage(page);
  // Straight to the URL rather than through the Assets menu: these tests arrive
  // here from other pages, and clicking an already-expanded menu collapses it.
  await page.goto('/organisation_assets');
  await reportsPage.clickDownloadIcon();
  const filePath = await reportsPage.downloadInventoryReport(downloadDir, type);
  return readCsvRecords(filePath);
}

test.describe('Inventory reports - content and access', () => {

  for (const type of ['active', 'inactive'] as const) {
    // A renamed or dropped column breaks every downstream consumer of the file
    // while the download itself keeps working.
    test(`the ${type} report carries its expected columns and some rows`, async ({ page }) => {
      await login(page, 'hr');
      const rows = await downloadRows(page, type);

      expect(rows.length, `the ${type} report came back with no rows`).toBeGreaterThan(0);
      expect(Object.keys(rows[0])).toEqual(EXPECTED_COLUMNS);
    });
  }

  test('the active report lists only in-service assets', async ({ page }) => {
    await login(page, 'hr');
    const rows = await downloadRows(page, 'active');

    const wrong = rows.filter((r) => !IN_SERVICE.includes(r['Status']));
    expect(
      wrong.map((r) => `${r['Serial Number']} (${r['Status']})`),
      'these assets are not in service but appear in the active report'
    ).toEqual([]);
  });

  test('the inactive report lists no in-service assets', async ({ page }) => {
    await login(page, 'hr');
    const rows = await downloadRows(page, 'inactive');

    const wrong = rows.filter((r) => IN_SERVICE.includes(r['Status']));
    expect(
      wrong.map((r) => `${r['Serial Number']} (${r['Status']})`),
      'these assets are in service but appear in the inactive report'
    ).toEqual([]);
  });

  // The invariant that makes the pair of reports trustworthy: together they
  // partition the inventory, so no asset can be counted twice or go missing.
  test('no asset appears in both reports', async ({ page }) => {
    await login(page, 'hr');
    const active = await downloadRows(page, 'active');
    const inactive = await downloadRows(page, 'inactive');

    const activeSerials = new Set(active.map((r) => r['Serial Number']));
    const inBoth = inactive
      .map((r) => r['Serial Number'])
      .filter((serial) => activeSerials.has(serial));

    expect(inBoth, 'these serial numbers are in the active and the inactive report').toEqual([]);
  });

  // End to end: a brand new In Stock asset has to reach the active report, and
  // must not appear in the inactive one.
  test('a newly added asset shows up in the active report only', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.loginAs('admin');
    await inventoryPage.navigateTo();

    const serial = uniqueSerial('report');
    await createAsset(inventoryPage, { serial, assetOf: 'Josh' });

    const active = await downloadRows(page, 'active');
    expect(
      active.map((r) => r['Serial Number']),
      `the asset just added (${serial}) is missing from the active report`
    ).toContain(serial);

    const inactive = await downloadRows(page, 'inactive');
    expect(
      inactive.map((r) => r['Serial Number']),
      `the asset just added (${serial}) is in service but appears in the inactive report`
    ).not.toContain(serial);
  });

  // The report URL is guessable and carries the whole inventory — every serial
  // number, owner and cost — so the endpoint itself has to be guarded, not just
  // the page that links to it.
  for (const type of ['active', 'inactive'] as const) {
    test(`an employee cannot download the ${type} report by URL`, async ({ page }) => {
      await login(page, 'employee');
      const response = await page.request.get(
        `/organisation_assets/download_report?report_type=${type}`
      );
      expect(
        response.headers()['content-type'],
        `an employee was served the ${type} inventory report`
      ).not.toContain('text/csv');
    });
  }

  // Documenting rather than complaining: the controller treats any value that is
  // not "active" as a request for the inactive report. Nothing in the UI can
  // produce another value, and the fallback neither errors nor leaks anything
  // the inactive report does not already contain — but if it ever starts
  // returning the ACTIVE report, or a 500, this says so.
  test('an unrecognised report type falls back to the inactive report', async ({ page }) => {
    await login(page, 'hr');
    const [bogus, inactive] = await Promise.all([
      page.request.get('/organisation_assets/download_report?report_type=nonsense'),
      page.request.get('/organisation_assets/download_report?report_type=inactive'),
    ]);

    expect(bogus.status()).toBe(200);
    expect(bogus.headers()['content-type']).toContain('text/csv');
    expect(await bogus.text()).toBe(await inactive.text());
  });
});
