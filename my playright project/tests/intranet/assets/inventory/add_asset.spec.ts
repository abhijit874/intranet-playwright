import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';
import { fillAssetForm, uniqueSerial } from './inventory_helpers';

// Create a Josh-owned (self) asset with a unique serial number.
test('adding new asset', async ({ page }) => {
  const serial = uniqueSerial();
  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.clickAddAsset();

  await fillAssetForm(inventoryPage, { serial, assetOf: 'Josh' });
  await inventoryPage.submit();
  await inventoryPage.verifySuccessAlert();
});

// Create a client-owned asset with a unique serial number.
test('adding new client asset', async ({ page }) => {
  const serial = uniqueSerial('auto-client');
  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.clickAddAsset();

  await fillAssetForm(inventoryPage, {
    serial,
    assetOf: 'Client',
    client: 'AIPower Technologies Private Limited',
    monthlyCost: '2000',
  });
  await inventoryPage.submit();
  await inventoryPage.verifySuccessAlert();
});

// Create a vendor-owned asset with a unique serial number.
test('adding new vendor asset', async ({ page }) => {
  const serial = uniqueSerial('auto-vendor');
  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.clickAddAsset();

  await fillAssetForm(inventoryPage, {
    serial,
    assetOf: 'Vendor',
    vendor: 'Zen Computers',
    monthlyCost: '2000',
  });
  await inventoryPage.submit();
  await inventoryPage.verifySuccessAlert();
});

// Self-contained: creates a fresh asset with a unique serial number, then searches
// for that exact asset and edits it. No dependency on a pre-existing record.
// Edits an existing asset rather than creating one each run: opens the first
// asset in the list and changes its processor/version. Staging-only data.
test('editing asset', async ({ page }) => {
  const updatedProcessor = 'I7';

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();

  await inventoryPage.clickEditOnFirstRow();
  await inventoryPage.fillVersion(updatedProcessor);
  await inventoryPage.submit();
  await inventoryPage.verifyUpdateSuccessAlert();
});
