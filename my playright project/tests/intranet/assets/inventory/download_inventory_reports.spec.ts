import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { InventoryReportsPage } from '../../pages/assets/InventoryReportsPage';

// Data-driven: the active and inactive inventory report downloads are identical
// flows differing only by report type, so they are generated from one dataset.
const reportTypes: Array<'active' | 'inactive'> = ['active', 'inactive'];

for (const reportType of reportTypes) {
  test(`download ${reportType} inventory report`, async ({ page }) => {
    const reportsPage = new InventoryReportsPage(page);
    await reportsPage.loginAs('hr');
    await reportsPage.navigateTo();
    await reportsPage.clickDownloadIcon();

    const downloadDir = path.resolve(__dirname, '../downloads');
    const filePath = await reportsPage.downloadInventoryReport(downloadDir, reportType);
    expect(fs.existsSync(filePath)).toBe(true);
  });
}
