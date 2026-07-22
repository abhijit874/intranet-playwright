import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { BepReportsPage } from '../pages/activities/BepReportsPage';
import { processBepReportCsv } from '../utils/bep_report_filter';

// Downloads the Approved Benefits Report for the CURRENT quarter (the page
// pre-selects it) and verifies it contains rows — the suite approves records
// in this quarter, so an empty current-quarter report means the wrong period
// was downloaded or the report broke. A specific period can be forced with
// BEP_YEAR / BEP_QUARTER (quarter 1-4 of the financial year).
test('download approved benefits', async ({ page }) => {
  const bepPage = new BepReportsPage(page);
  await bepPage.loginAs('hr');
  await bepPage.navigateToBepReports();

  if (process.env.BEP_YEAR) await bepPage.selectBepYear(process.env.BEP_YEAR);
  if (process.env.BEP_QUARTER) await bepPage.selectBepQuarter(process.env.BEP_QUARTER);
  const period = await bepPage.getSelectedPeriod();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await bepPage.downloadApprovedBenefits(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processBepReportCsv(filePath);
  console.log(
    `BEP report for ${period.year} Q${period.quarter} saved: ${filePath}. ` +
      `Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
  // The report must not be an empty shell for the selected quarter.
  expect(processed.totalRows).toBeGreaterThan(0);
});
