import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { BepReportsPage } from '../pages/activities/BepReportsPage';
import { processActivityReportCsv } from '../utils/activity_report_filter';

// Downloads the Activity Report for the CURRENT quarter (the page pre-selects
// it) and verifies it actually contains rows — the suite itself creates
// activity records every run, so an empty current-quarter report means the
// wrong period was downloaded or the report broke. A specific period can be
// forced with BEP_YEAR / BEP_QUARTER (quarter 1-4 of the financial year).
test('activity report', async ({ page }) => {
  const bepPage = new BepReportsPage(page);
  await bepPage.loginAs('hr');
  await bepPage.navigateToBepReports();

  if (process.env.BEP_YEAR) await bepPage.selectBepYear(process.env.BEP_YEAR);
  if (process.env.BEP_QUARTER) await bepPage.selectBepQuarter(process.env.BEP_QUARTER);
  const period = await bepPage.getSelectedPeriod();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await bepPage.downloadActivityReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processActivityReportCsv(filePath);
  console.log(
    `Activity report for ${period.year} Q${period.quarter} saved: ${filePath}. ` +
      `Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
  // The report must not be an empty shell for the selected quarter.
  expect(processed.totalRows).toBeGreaterThan(0);
});
