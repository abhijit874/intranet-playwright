import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';
import { processAllocationReportCsv } from '../../utils/allocation_report_filter';

test('allocation report automation - download and process csv', async ({ page }) => {
  const assetAllocPage = new AssetAllocationPage(page);
  await assetAllocPage.loginAs('hr');
  await assetAllocPage.navigateTo();
  await assetAllocPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../../downloads');
  const filePath = await assetAllocPage.downloadAllocationReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processAllocationReportCsv(filePath);
  console.log(
    `Allocation report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
