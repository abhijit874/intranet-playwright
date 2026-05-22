import { test } from '@playwright/test';
import { InventoryPage } from '../../pages/assets/InventoryPage';

test('adding new vendor asset', async ({ page }) => {
  const inventoryPage = new InventoryPage(page);
  await inventoryPage.loginAs('hr');
  await inventoryPage.navigateTo();
  await inventoryPage.clickAddAsset();

  await inventoryPage.selectCategory('Hardware');
  await inventoryPage.selectHardwareType('Laptop');
  await inventoryPage.selectAssetType('Non Consumable');
  await inventoryPage.fillRam('32');
  await inventoryPage.fillRom('512');
  await inventoryPage.selectOs('Windows');
  await inventoryPage.checkWithCharger();
  await inventoryPage.fillChargerSerial('charger456');
  await inventoryPage.selectManufacturingCompany('Dell');
  await inventoryPage.selectAssetName('DELL LATITUDE 3410');
  await inventoryPage.fillSerialNumber('automation-vendor-345');
  await inventoryPage.fillVersion('I9');
  await inventoryPage.selectLocation('Pune');
  await inventoryPage.selectAssetOf('Vendor');
  await inventoryPage.selectVendor('Zen Computers');
  await inventoryPage.fillMonthlyCost('2000');
  await inventoryPage.selectAvailabilityStatus('In Stock');
  await inventoryPage.fillReceivedDate('2026-05-10');
  await inventoryPage.fillLockingPeriod('12');
  await inventoryPage.submit();
});
