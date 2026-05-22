import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';

test('download allocation report', async ({ page }) => {
  const assetAllocPage = new AssetAllocationPage(page);
  await assetAllocPage.loginAs('hr');
  await assetAllocPage.navigateTo();
  await assetAllocPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../../downloads');
  const filePath = await assetAllocPage.downloadAllocationReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);
});
