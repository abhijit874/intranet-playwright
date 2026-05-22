import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { ProjectsPage } from '../pages/ProjectsPage';
import { processProjectReportCsv } from '../utils/project_report_filter';

test('project report automation - download and process csv', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();
  await projectsPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await projectsPage.downloadProjectsReport(downloadDir);

  const processed = processProjectReportCsv(filePath);
  console.log(
    `Project report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
