import { InventoryPage } from '../../pages/assets/InventoryPage';

// Shared builders for the inventory specs so that every test can create its own
// asset with a unique serial number (self-contained — no dependency on a
// pre-seeded record). Mirrors the edit_helpers.ts approach used in the
// "activities and benefits" folder.

export type AssetOwner = 'Josh' | 'Client' | 'Vendor';

export interface AssetConfig {
  serial: string;
  assetOf: AssetOwner;
  client?: string;
  vendor?: string;
  chargerSerial?: string;
  category?: string;
  hardwareType?: string;
  assetType?: string;
  ram?: string;
  rom?: string;
  os?: string;
  manufacturingCompany?: string;
  assetName?: string;
  version?: string;
  location?: string;
  monthlyCost?: string;
  availabilityStatus?: string;
  receivedDate?: string;
  lockingPeriod?: string;
}

// Serial numbers must be unique per run to keep the tests repeatable.
export function uniqueSerial(prefix = 'auto'): string {
  return `${prefix}-${Date.now()}`;
}

// Fills the full "add asset" form from a config, defaulting every optional field.
// Assumes the Add Asset form is already open (call inventoryPage.clickAddAsset()
// first). The dropdown ordering matches the working per-owner flows: the vendor
// dropdown only appears after "Vendor" is chosen, and the client combobox only
// after "Client" is chosen.
export async function fillAssetForm(inventoryPage: InventoryPage, cfg: AssetConfig) {
  await inventoryPage.selectCategory(cfg.category ?? 'Hardware');
  await inventoryPage.selectHardwareType(cfg.hardwareType ?? 'Laptop');
  await inventoryPage.selectAssetType(cfg.assetType ?? 'Non Consumable');
  await inventoryPage.fillRam(cfg.ram ?? '32');
  await inventoryPage.fillRom(cfg.rom ?? '512');
  await inventoryPage.selectOs(cfg.os ?? 'Windows');
  await inventoryPage.checkWithCharger();
  await inventoryPage.fillChargerSerial(cfg.chargerSerial ?? `chg-${Date.now()}`);
  // Manufacturer/asset-name/location aren't asserted anywhere, so pick them at
  // random (the dropdowns only offer valid values). The asset-name list depends on
  // the manufacturer, hence the ordering.
  if (cfg.manufacturingCompany) {
    await inventoryPage.selectManufacturingCompany(cfg.manufacturingCompany);
  } else {
    await inventoryPage.selectRandomManufacturingCompany();
  }
  if (cfg.assetName) {
    await inventoryPage.selectAssetName(cfg.assetName);
  } else {
    await inventoryPage.selectRandomAssetName();
  }
  await inventoryPage.fillSerialNumber(cfg.serial);
  await inventoryPage.fillVersion(cfg.version ?? 'I9');
  if (cfg.location) {
    await inventoryPage.selectLocation(cfg.location);
  } else {
    await inventoryPage.selectRandomLocation();
  }
  await inventoryPage.selectAssetOf(cfg.assetOf);

  if (cfg.assetOf === 'Vendor') {
    if (cfg.vendor) {
      await inventoryPage.selectVendor(cfg.vendor);
    } else {
      await inventoryPage.selectRandomVendor();
    }
  }

  await inventoryPage.fillMonthlyCost(cfg.monthlyCost ?? '1200');

  if (cfg.assetOf === 'Client') {
    await inventoryPage.selectClient('Select client', cfg.client ?? 'AIPower Technologies Private Limited');
  }

  await inventoryPage.selectAvailabilityStatus(cfg.availabilityStatus ?? 'In Stock');
  await inventoryPage.fillReceivedDate(cfg.receivedDate ?? '2026-05-10');
  await inventoryPage.fillLockingPeriod(cfg.lockingPeriod ?? '12');
}

// Convenience: opens the Add Asset form, fills it, submits, and returns the
// serial so the caller can search for / act on the exact record it created.
export async function createAsset(inventoryPage: InventoryPage, cfg: AssetConfig): Promise<string> {
  await inventoryPage.clickAddAsset();
  await fillAssetForm(inventoryPage, cfg);
  await inventoryPage.submit();
  return cfg.serial;
}
