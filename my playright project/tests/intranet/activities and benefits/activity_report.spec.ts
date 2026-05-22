import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';
import { processActivityReportCsv } from '../utils/activity_report_filter';

test('activity report', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  await activitiesPage.loginAs('hr');
  await activitiesPage.navigateToBepReports();
  await activitiesPage.selectBepYear('2026');
  await activitiesPage.selectBepQuarter('4');

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await activitiesPage.downloadActivityReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processActivityReportCsv(filePath);
  console.log(
    `Activity report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
