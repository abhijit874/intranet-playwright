import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';
import { processPidWiseAssetCostReportCsv } from '../../utils/pid_wise_asset_cost_report_filter';

test('pid-wise asset cost report automation - download and process csv', async ({ page }) => {
  const assetAllocPage = new AssetAllocationPage(page);
  await assetAllocPage.loginAs('hr');
  await assetAllocPage.navigateTo();
  await assetAllocPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../../downloads');
  const filePath = await assetAllocPage.downloadPidWiseAssetCostReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processPidWiseAssetCostReportCsv(filePath);
  console.log(
    `PID-wise asset cost report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
