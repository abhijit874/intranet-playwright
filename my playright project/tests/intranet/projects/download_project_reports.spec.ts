import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { ProjectReportsPage } from '../pages/ProjectReportsPage';

// Both project report downloads open the same download dropdown and pick a report
// item; they are kept as two tests in one file.
test('download projects report', async ({ page }) => {
  const reportsPage = new ProjectReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();
  await reportsPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await reportsPage.downloadProjectsReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);
});

test('download project teams report', async ({ page }) => {
  const reportsPage = new ProjectReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();
  await reportsPage.clickDownloadIcon();
  await reportsPage.downloadProjectTeamsReport();
});
