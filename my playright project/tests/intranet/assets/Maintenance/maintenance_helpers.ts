import * as path from 'path';
import { MaintenancePage } from '../../pages/assets/MaintenancePage';

// Shared builder for the maintenance specs so every test can create its own
// maintenance record (self-contained — no dependency on a pre-seeded record).
// Mirrors inventory_helpers.ts / allocation_helpers.ts.

const IMAGE_PATH = path.join(__dirname, '../../../fixtures/image.png');

export interface MaintenanceConfig {
  reason: string;
  vendor?: string;
  cost?: string;
  fromDate?: string;
  endDate?: string;
  imagePath?: string;
}

// Maintenance records are located by their reason, so a per-run stamp keeps the
// created record uniquely findable.
export function uniqueReason(prefix = 'playwright automation'): string {
  return `${prefix} ${Date.now()}`;
}

// Creates a maintenance record on the first available asset and verifies the
// success alert. Returns the reason so callers can locate the exact record.
// Assumes navigateTo() has already been called.
export async function createMaintenance(
  maintenancePage: MaintenancePage,
  cfg: MaintenanceConfig
): Promise<string> {
  await maintenancePage.clickAddAsset();
  // Both dropdowns only offer valid choices, so pick at random rather than always
  // the first asset / a fixed vendor — this spreads records across the data.
  await maintenancePage.selectRandomMaintenanceAsset();
  if (cfg.vendor) {
    await maintenancePage.selectVendor(cfg.vendor);
  } else {
    await maintenancePage.selectRandomVendor();
  }
  await maintenancePage.fillCost(cfg.cost ?? '1200');
  await maintenancePage.fillReason(cfg.reason);
  await maintenancePage.fillFromDate(cfg.fromDate ?? '2026-05-10');
  await maintenancePage.fillEndDate(cfg.endDate ?? '2026-06-01');
  await maintenancePage.uploadImage(cfg.imagePath ?? IMAGE_PATH);
  await maintenancePage.submit();
  await maintenancePage.verifySuccessAlert();

  return cfg.reason;
}
