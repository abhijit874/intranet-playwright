import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';

test('download maintenance report', async ({ page }) => {
  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();

  const downloadDir = path.resolve(__dirname, '../../downloads');
  const filePath = await maintenancePage.downloadReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);
});
