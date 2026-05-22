import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';
import { processMaintenanceReportCsv } from '../../utils/maintenance_report_filter';

test('maintenance report automation - download and process csv', async ({ page }) => {
  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();

  const downloadDir = path.resolve(__dirname, '../../downloads');
  const filePath = await maintenancePage.downloadReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processMaintenanceReportCsv(filePath);
  console.log(
    `Maintenance report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
