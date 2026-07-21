import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';

// Shared builder for the allocation specs so every test can create its own
// allocation (self-contained — no dependency on a pre-seeded record). Mirrors
// inventory_helpers.ts.

export interface AllocationConfig {
  purpose: string;
  user?: string;
  allocatedFrom?: string;
  issuedDate?: string;
}

// Purposes don't have to be unique, but a per-run stamp keeps records
// distinguishable when a test needs to locate the one it just created.
export function uniquePurpose(prefix = 'playwright automation'): string {
  return `${prefix} ${Date.now()}`;
}

// Creates an allocation on the first available asset and returns that asset's
// serial number (parsed from the option label, e.g. "DELL LATITUDE 3410 (6TWR863)").
// The allocation table has no purpose column, so callers locate the record by
// this serial. Assumes navigateTo() has already been called.
export async function createAllocation(
  allocationPage: AssetAllocationPage,
  cfg: AllocationConfig
): Promise<string> {
  await allocationPage.clickAddAssetAllocation();
  // The dropdown only lists allocatable assets, so pick one at random rather than
  // always taking the first — this spreads allocations across the inventory.
  const assetName = await allocationPage.selectRandomAsset();
  // No specific user requested: pick a random one from the dropdown so allocations
  // spread across employees rather than always landing on the same person.
  if (cfg.user) {
    await allocationPage.selectUser(cfg.user);
  } else {
    await allocationPage.selectRandomUser();
  }
  await allocationPage.selectAllocatedFrom(cfg.allocatedFrom ?? 'Pune');
  await allocationPage.fillPurpose(cfg.purpose);
  await allocationPage.fillIssuedDate(cfg.issuedDate ?? '2026-05-10');
  await allocationPage.submit();
  await allocationPage.verifySuccessAlert();

  return assetName.match(/\(([^)]+)\)/)?.[1] ?? assetName;
}
