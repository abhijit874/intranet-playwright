import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { BepReportsPage } from '../pages/activities/BepReportsPage';
import { processBepReportCsv } from '../utils/bep_report_filter';

test('download approved benefits', async ({ page }) => {
  const bepPage = new BepReportsPage(page);
  await bepPage.loginAs('hr');
  await bepPage.navigateToBepReports();
  await bepPage.selectBepYear('2026');
  await bepPage.selectBepQuarter('4');

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await bepPage.downloadApprovedBenefits(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processBepReportCsv(filePath);
  console.log(
    `BEP report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
