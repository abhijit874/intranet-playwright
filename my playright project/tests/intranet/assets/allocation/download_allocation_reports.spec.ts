import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { AssetAllocationReportsPage } from '../../pages/assets/AssetAllocationReportsPage';

// Data-driven: the allocation report and the assets-costs (PID-wise) report are
// identical download-and-verify flows differing only by which menu item is
// clicked, so they are generated from one dataset.
const reports: Array<{
  name: string;
  download: (p: AssetAllocationReportsPage, dir: string) => Promise<string>;
}> = [
  { name: 'allocation report', download: (p, dir) => p.downloadAllocationReport(dir) },
  { name: 'assets costs report', download: (p, dir) => p.downloadPidWiseAssetCostReport(dir) },
];

for (const report of reports) {
  test(`download ${report.name}`, async ({ page }) => {
    const reportsPage = new AssetAllocationReportsPage(page);
    await reportsPage.loginAs('hr');
    await reportsPage.navigateTo();
    await reportsPage.clickDownloadIcon();

    const downloadDir = path.resolve(__dirname, '../../downloads');
    const filePath = await report.download(reportsPage, downloadDir);
    expect(fs.existsSync(filePath)).toBe(true);
  });
}

// The PID-wise report modal lets the user pick a month, so a previous month's
// report can be downloaded for reference. Selects the most recent previous month
// (rather than hardcoding one) and confirms the downloaded file is for that month.
test('download pid-wise asset cost report for a previous month', async ({ page }) => {
  const reportsPage = new AssetAllocationReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();
  await reportsPage.clickDownloadIcon();

  await reportsPage.openPidWiseReportModal();
  const month = await reportsPage.selectPidWiseReportMonth();

  const downloadDir = path.resolve(__dirname, '../../downloads');
  const filePath = await reportsPage.downloadFromPidWiseModal(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);
  // the downloaded filename embeds the month (e.g. "... - May-2026.csv"), proving
  // the month selection took effect
  expect(path.basename(filePath)).toContain(month);
});
