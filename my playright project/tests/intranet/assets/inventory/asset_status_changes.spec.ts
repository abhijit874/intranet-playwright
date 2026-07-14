import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';
import { createAsset, uniqueSerial } from './inventory_helpers';

// Each test creates its own asset with a unique serial, then changes its
// availability status. Self-contained — no dependency on a pre-seeded record.

test('discontinue existing asset', async ({ page }) => {
  const serialNumber = uniqueSerial();

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();

  // create the asset this test will discontinue
  await createAsset(inventoryPage, { serial: serialNumber, assetOf: 'Josh' });
  await inventoryPage.verifySuccessAlert();

  // find it and discontinue it
  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset(serialNumber);
  await inventoryPage.clickEditOnRow(serialNumber);
  await expect(page.locator('#asset_serial_number')).toHaveValue(serialNumber);
  await expect(page.locator('#select2-asset_availability_status-container')).toContainText('In Stock');
  await inventoryPage.selectAvailabilityStatus('Discontinue');
  await inventoryPage.fillDiscontinueDate('2026-05-10');
  await inventoryPage.submit();
  await inventoryPage.verifyUpdateSuccessAlert();
});

test('return asset to client', async ({ page }) => {
  const serialNumber = uniqueSerial('auto-client');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();

  // create the client asset this test will return
  await createAsset(inventoryPage, {
    serial: serialNumber,
    assetOf: 'Client',
    client: 'AIPower Technologies Private Limited',
    monthlyCost: '2000',
  });
  await inventoryPage.verifySuccessAlert();

  // find it and return it to the client
  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset(serialNumber);
  await inventoryPage.clickEditOnRow(serialNumber);
  await expect(page.locator('#asset_serial_number')).toHaveValue(serialNumber);
  await expect(page.locator('#select2-asset_asset_of-container')).toContainText('Client');
  await inventoryPage.selectAvailabilityStatus('Returned to Client');
  await inventoryPage.fillDiscontinueDate('2026-05-10');
  await inventoryPage.submit();
  await inventoryPage.verifyUpdateSuccessAlert();
});

test('return asset to vendor', async ({ page }) => {
  const serialNumber = uniqueSerial('auto-vendor');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();

  // create the vendor asset this test will return
  await createAsset(inventoryPage, {
    serial: serialNumber,
    assetOf: 'Vendor',
    vendor: 'Zen Computers',
    monthlyCost: '2000',
  });
  await inventoryPage.verifySuccessAlert();

  // find it and return it to the vendor
  await inventoryPage.navigateTo();
  await inventoryPage.searchAsset(serialNumber);
  await inventoryPage.clickEditOnRow(serialNumber);
  await expect(page.locator('#asset_serial_number')).toHaveValue(serialNumber);
  await expect(page.locator('#select2-asset_asset_of-container')).toContainText('Vendor');
  await inventoryPage.selectAvailabilityStatus('Returned to Vendor');
  await inventoryPage.fillDiscontinueDate('2026-05-10');
  await inventoryPage.submit();
  await inventoryPage.verifyUpdateSuccessAlert();
});
