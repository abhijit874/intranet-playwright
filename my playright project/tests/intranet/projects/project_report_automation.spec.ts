import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { ProjectReportsPage } from '../pages/ProjectReportsPage';
import { processProjectReportCsv } from '../utils/project_report_filter';

test('project report automation - download and process csv', async ({ page }) => {
  const reportsPage = new ProjectReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();
  await reportsPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await reportsPage.downloadProjectsReport(downloadDir);

  const processed = processProjectReportCsv(filePath);
  console.log(
    `Project report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
