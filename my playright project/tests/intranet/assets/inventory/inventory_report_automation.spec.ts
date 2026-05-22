import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { InventoryPage } from '../../pages/assets/InventoryPage';
import { processInventoryReportCsv } from '../../utils/inventory_report_filter';

function inventoryReportType(): 'active' | 'inactive' {
  const reportType = (process.env.INVENTORY_REPORT_TYPE || process.env.REPORT_TYPE || 'active')
    .trim()
    .toLowerCase();
  if (reportType !== 'active' && reportType !== 'inactive') {
    throw new Error(`Unsupported inventory report type: ${reportType}`);
  }
  return reportType;
}

test('inventory report automation - download and process csv', async ({ page }) => {
  const reportType = inventoryReportType();

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await inventoryPage.downloadInventoryReport(downloadDir, reportType);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processInventoryReportCsv(filePath);
  console.log(
    `Inventory ${reportType} report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
