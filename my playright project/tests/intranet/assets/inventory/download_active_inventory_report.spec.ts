import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { InventoryPage } from '../../pages/assets/InventoryPage';

test('download inventory report', async ({ page }) => {
  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await inventoryPage.downloadInventoryReport(downloadDir, 'active');
  expect(fs.existsSync(filePath)).toBe(true);
});
