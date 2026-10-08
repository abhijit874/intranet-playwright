import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { AssetAllocationReportsPage } from '../../pages/assets/AssetAllocationReportsPage';

/**
 * Allocation reports — month picker edge cases.
 *
 * Both the PID-wise Asset Cost Report and the Active Asset Register are
 * downloaded through a modal whose only input is a month. The existing specs
 * prove a file comes back for one month; nothing checks the list of months
 * itself, and that list is generated code with several ways to go quietly wrong:
 * an off-by-one exposing the current (incomplete) month, a gap or a duplicate in
 * the rolling window, or — worst, because the file still downloads and looks
 * right — an option whose label and value disagree, so the user picks Jul and
 * receives Aug.
 *
 * None of those raise an error. They produce a plausible-looking report of the
 * wrong period, which is exactly the kind of defect a happy-path suite ships.
 *
 * Written against 2026-09-24, when the picker offered Aug-2026 back to Sep-2025.
 * Every assertion below is relative to the current date, so nothing ages out.
 */

const downloadDir = path.resolve(__dirname, '../../../../test-results/allocation-reports');

interface MonthOption {
  value: string;
  label: string;
}

async function readMonthOptions(page: Page, selectSelector: string): Promise<MonthOption[]> {
  const options = await page.locator(selectSelector).locator('option').evaluateAll((els) =>
    els.map((e) => ({
      value: (e as HTMLOptionElement).value,
      label: (e.textContent ?? '').trim(),
    }))
  );
  expect(options.length, `${selectSelector} offered no months at all`).toBeGreaterThan(1);
  return options;
}

// "2026-08" -> its position in a continuous month count, so neighbouring months
// differ by exactly 1 across a year boundary (Jan-2026 follows Dec-2025).
function monthIndex(value: string): number {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + month;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The two modals are the same shape, so the picker rules are asserted against both.
const pickers: Array<{
  report: string;
  select: string;
  open: (p: AssetAllocationReportsPage) => Promise<unknown>;
}> = [
  {
    report: 'PID-wise Asset Cost Report',
    select: '#pid_wise_report_modal #reportDate',
    open: (p) => p.openPidWiseReportModal(),
  },
  {
    report: 'Active Asset Register',
    select: '#active_asset_register_modal #activeAssetRegisterReportDate',
    open: (p) => p.openActiveAssetRegisterModal(),
  },
];

test.describe('Allocation reports - month picker', () => {

  for (const picker of pickers) {
    test(`${picker.report}: no future month is offered`, async ({ page }) => {
      const reportsPage = new AssetAllocationReportsPage(page);
      await reportsPage.loginAs('hr');
      await reportsPage.navigateTo();
      await reportsPage.clickDownloadIcon();
      await picker.open(reportsPage);

      const options = await readMonthOptions(page, picker.select);
      const now = new Date();
      const thisMonth = (now.getFullYear() * 12) + (now.getMonth() + 1);

      for (const option of options) {
        expect(
          monthIndex(option.value),
          `${picker.report} offers "${option.label}", which is in the future`
        ).toBeLessThanOrEqual(thisMonth);
      }
    });

    test(`${picker.report}: the months run newest-first with no gaps or repeats`, async ({ page }) => {
      const reportsPage = new AssetAllocationReportsPage(page);
      await reportsPage.loginAs('hr');
      await reportsPage.navigateTo();
      await reportsPage.clickDownloadIcon();
      await picker.open(reportsPage);

      const options = await readMonthOptions(page, picker.select);
      const indexes = options.map((o) => monthIndex(o.value));

      // Each month is exactly one earlier than the one before it. This catches a
      // skipped month and a repeated one in the same assertion.
      for (let i = 1; i < indexes.length; i++) {
        expect(
          indexes[i],
          `${picker.report}: "${options[i].label}" does not immediately follow "${options[i - 1].label}"`
        ).toBe(indexes[i - 1] - 1);
      }
    });

    // The label is what the user picks by; the value is what gets submitted. If
    // they disagree, the report downloads happily for the wrong month.
    test(`${picker.report}: every month label matches the value it submits`, async ({ page }) => {
      const reportsPage = new AssetAllocationReportsPage(page);
      await reportsPage.loginAs('hr');
      await reportsPage.navigateTo();
      await reportsPage.clickDownloadIcon();
      await picker.open(reportsPage);

      const options = await readMonthOptions(page, picker.select);
      for (const { value, label } of options) {
        const [year, month] = value.split('-').map(Number);
        expect(
          label,
          `${picker.report}: the option labelled "${label}" submits "${value}"`
        ).toBe(`${MONTH_LABELS[month - 1]}-${year}`);
      }
    });
  }

  // The picker is a rolling 12-month window ending at last month — the current
  // month is deliberately absent, since a cost report for an unfinished month
  // would be misleading. Update the count here if that window is changed on
  // purpose; a change nobody intended is what this is here to catch.
  test('PID-wise report: the window is the twelve months ending with last month', async ({ page }) => {
    const reportsPage = new AssetAllocationReportsPage(page);
    await reportsPage.loginAs('hr');
    await reportsPage.navigateTo();
    await reportsPage.clickDownloadIcon();
    await reportsPage.openPidWiseReportModal();

    const options = await readMonthOptions(page, '#pid_wise_report_modal #reportDate');
    expect(options).toHaveLength(12);

    const now = new Date();
    const lastMonth = (now.getFullYear() * 12) + now.getMonth();
    expect(
      monthIndex(options[0].value),
      `the newest month offered is "${options[0].label}", not last month`
    ).toBe(lastMonth);
  });

  // The far end of the range. A report generator that works for recent months can
  // still fall over on the oldest one — and an empty file would download just as
  // silently as a full one.
  test('PID-wise report: the oldest month still produces a report for that month', async ({ page }) => {
    const reportsPage = new AssetAllocationReportsPage(page);
    await reportsPage.loginAs('hr');
    await reportsPage.navigateTo();
    await reportsPage.clickDownloadIcon();
    await reportsPage.openPidWiseReportModal();

    const options = await readMonthOptions(page, '#pid_wise_report_modal #reportDate');
    const oldest = options[options.length - 1];
    const month = await reportsPage.selectPidWiseReportMonth(oldest.value);
    expect(month).toBe(oldest.label);

    const filePath = await reportsPage.downloadFromPidWiseModal(downloadDir);
    // The filename embeds the month, so this proves the picked month reached the
    // server rather than the default being used.
    expect(path.basename(filePath)).toContain(oldest.label);

    const rows = fs.readFileSync(filePath, 'utf8').trim().split('\n');
    expect(rows[0], 'the report came back without its header row').toContain('Employee ID');
    expect(rows.length, `the report for ${oldest.label} has a header but no data`).toBeGreaterThan(1);
  });

  // A column rename or drop breaks every downstream consumer of this file while
  // the download itself keeps working.
  test('PID-wise report: the CSV carries its expected columns', async ({ page }) => {
    const reportsPage = new AssetAllocationReportsPage(page);
    await reportsPage.loginAs('hr');
    await reportsPage.navigateTo();
    await reportsPage.clickDownloadIcon();

    const filePath = await reportsPage.downloadPidWiseAssetCostReport(downloadDir);
    const header = fs.readFileSync(filePath, 'utf8').split('\n')[0].trim();

    expect(header.split(',')).toEqual([
      'Employee ID',
      'Employee Email ID',
      'User Name',
      'PID',
      'Project Name',
      "EM's Employee ID",
      'Engineering Manager',
      'Employee Status',
      'Location',
      'Serial Number',
      'Processor',
      'OS',
      'RAM',
      'ROM',
      'Asset of',
      'Vendor Name',
      'Manufacturing Company',
      'Monthly Cost',
    ]);
  });

  test('Active Asset Register: the oldest month still produces a non-empty report', async ({ page }) => {
    const reportsPage = new AssetAllocationReportsPage(page);
    await reportsPage.loginAs('hr');
    await reportsPage.navigateTo();
    await reportsPage.clickDownloadIcon();
    await reportsPage.openActiveAssetRegisterModal();

    const options = await readMonthOptions(page, '#active_asset_register_modal #activeAssetRegisterReportDate');
    const oldest = options[options.length - 1];
    const month = await reportsPage.selectActiveAssetRegisterMonth(oldest.value);
    expect(month).toBe(oldest.label);

    const filePath = await reportsPage.downloadFromActiveAssetRegisterModal(downloadDir);
    const rows = fs.readFileSync(filePath, 'utf8').trim().split('\n');
    expect(rows.length, `the register for ${oldest.label} came back empty`).toBeGreaterThan(1);
  });
});
