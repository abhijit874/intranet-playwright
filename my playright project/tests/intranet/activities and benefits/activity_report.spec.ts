import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { BepReportsPage } from '../pages/activities/BepReportsPage';
import { processActivityReportCsv } from '../utils/activity_report_filter';

test('activity report', async ({ page }) => {
  const bepPage = new BepReportsPage(page);
  await bepPage.loginAs('hr');
  await bepPage.navigateToBepReports();
  await bepPage.selectBepYear('2026');
  await bepPage.selectBepQuarter('4');

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await bepPage.downloadActivityReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processActivityReportCsv(filePath);
  console.log(
    `Activity report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
