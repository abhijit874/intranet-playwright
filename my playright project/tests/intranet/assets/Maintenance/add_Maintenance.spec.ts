import { test } from '@playwright/test';
import * as path from 'path';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';

test('adding maintenance', async ({ page }) => {
  const maintenancePage = new MaintenancePage(page);
  await maintenancePage.loginAs('hr');
  await maintenancePage.navigateTo();
  await maintenancePage.clickAddAsset();

  await maintenancePage.selectMaintenanceAsset('Dell Inspiron 3501 (7PLXLF3)');
  await maintenancePage.selectVendor('Zen Computers');
  await maintenancePage.fillCost('1200');
  await maintenancePage.fillReason('playwright automation with codex');
  await maintenancePage.fillFromDate('2026-05-10');
  await maintenancePage.fillEndDate('2026-06-01');
  await maintenancePage.uploadImage(path.join(__dirname, '../../../fixtures/image.png'));
  await maintenancePage.submit();
});
