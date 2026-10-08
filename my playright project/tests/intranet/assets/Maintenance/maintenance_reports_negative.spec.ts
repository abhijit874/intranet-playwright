import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import { MaintenanceReportsPage } from '../../pages/assets/MaintenanceReportsPage';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';
import { readCsvRecords } from '../../utils/csv_report_filter';
import { createMaintenance, uniqueReason } from './maintenance_helpers';
import { login } from '../../utils/login_helper';

/**
 * Maintenance report — content and access.
 *
 * The existing spec proves a file comes back and stops there, so nothing checks
 * that a record entered through the form actually reaches the report, or that
 * the dates and cost survive the round trip. A report that silently omits a
 * machine currently away for repair is the failure that matters here, and it
 * looks identical to a working one from the outside.
 */

const downloadDir = path.resolve(__dirname, '../../../../test-results/maintenance-reports');

const EXPECTED_COLUMNS = [
  'Asset Name',
  'Asset Serial Number',
  'Maintainer Name',
  'Given Date',
  'Received Date',
  'Cost',
  'Reason',
  'Received?',
  'Directly Allocated to Employee?',
];

async function downloadRows(page: Page) {
  const reportsPage = new MaintenanceReportsPage(page);
  // Straight to the URL rather than through the Assets menu: these tests arrive
  // here from other pages, and clicking an already-expanded menu collapses it.
  await page.goto('/asset_maintainances');
  const filePath = await reportsPage.downloadReport(downloadDir);
  return readCsvRecords(filePath);
}

test.describe('Maintenance report - content and access', () => {

  // A renamed or dropped column breaks every downstream consumer of the file
  // while the download itself keeps working.
  test('the report carries its expected columns and some rows', async ({ page }) => {
    await login(page, 'hr');
    const rows = await downloadRows(page);

    expect(rows.length, 'the maintenance report came back with no rows').toBeGreaterThan(0);
    expect(Object.keys(rows[0])).toEqual(EXPECTED_COLUMNS);
  });

  // End to end: what was typed into the form is what the report shows. Checking
  // the values, not just the presence of the row, is what catches a column
  // swapped with its neighbour — given/received dates are the obvious pair.
  test('a newly created maintenance record reaches the report with its values intact', async ({ page }) => {
    const maintenancePage = new MaintenancePage(page);
    await maintenancePage.loginAs('admin');
    await maintenancePage.navigateTo();

    const reason = uniqueReason('report check');
    await createMaintenance(maintenancePage, {
      reason,
      cost: '1234',
      fromDate: '2026-05-10',
      endDate: '2026-06-01',
    });

    const rows = await downloadRows(page);
    const row = rows.find((r) => r['Reason'] === reason);
    expect(row, `the maintenance record just created ("${reason}") is missing from the report`).toBeTruthy();

    // The report writes dates as DD/MM/YYYY and cost with a decimal.
    expect(row!['Given Date']).toBe('10/05/2026');
    expect(row!['Received Date']).toBe('01/06/2026');
    expect(Number(row!['Cost'])).toBe(1234);
  });

  // Every row describes a real maintenance visit, so a blank asset serial or
  // maintainer means a record was written without the thing it refers to.
  test('every row names an asset and a maintainer', async ({ page }) => {
    await login(page, 'hr');
    const rows = await downloadRows(page);

    const incomplete = rows.filter((r) => !r['Asset Serial Number']?.trim() || !r['Maintainer Name']?.trim());
    expect(
      incomplete.map((r) => `${r['Reason']} (asset: "${r['Asset Serial Number']}", maintainer: "${r['Maintainer Name']}")`),
      'these maintenance rows are missing an asset or a maintainer'
    ).toEqual([]);
  });

  // A record cannot come back before it went out.
  test('no row is received before it was given', async ({ page }) => {
    await login(page, 'hr');
    const rows = await downloadRows(page);

    const toDate = (value: string) => {
      const [d, m, y] = (value ?? '').split('/').map(Number);
      return d && m && y ? new Date(y, m - 1, d) : null;
    };

    const backwards = rows.filter((r) => {
      const given = toDate(r['Given Date']);
      const received = toDate(r['Received Date']);
      return given && received && received < given;
    });

    expect(
      backwards.map((r) => `${r['Asset Serial Number']}: given ${r['Given Date']}, received ${r['Received Date']}`),
      'these maintenance rows were received before they were given'
    ).toEqual([]);
  });

  // The report URL is guessable and lists the whole maintenance history with
  // serial numbers and costs, so the endpoint has to be guarded in its own right.
  test('an employee cannot download the maintenance report by URL', async ({ page }) => {
    await login(page, 'employee');
    const response = await page.request.get('/asset_maintainances/download_report');
    expect(
      response.headers()['content-type'],
      'an employee was served the maintenance report'
    ).not.toContain('text/csv');
  });
});
