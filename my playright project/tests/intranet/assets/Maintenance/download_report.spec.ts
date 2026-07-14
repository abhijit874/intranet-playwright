import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { MaintenanceReportsPage } from '../../pages/assets/MaintenanceReportsPage';

test('download maintenance report', async ({ page }) => {
  const reportsPage = new MaintenanceReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();

  const downloadDir = path.resolve(__dirname, '../../downloads');
  const filePath = await reportsPage.downloadReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);
});
