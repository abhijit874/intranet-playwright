import { test, expect } from '@playwright/test';
import { AssetAllocationPage } from '../../pages/assets/AssetAllocationPage';
import { createAllocation, uniquePurpose } from './allocation_helpers';

/**
 * Asset allocation — negative cases.
 *
 * Allocation is where the inventory can quietly go wrong: the same machine
 * handed to two people, a purpose left blank, or an asset recorded as returned
 * before it was ever issued. The positive specs only ever allocate a free asset
 * with sane dates, so none of that is exercised.
 *
 * Each test does exactly one wrong thing. Where a value is typed, the browser's
 * own validation is stripped first so the server is what answers — the control
 * test proves that bypass still submits a valid allocation.
 *
 * MAIL SIDE EFFECT — why this file is serial and shares one allocation.
 * Allocating an asset sends a real notification to the employee it is issued to,
 * and the form has no "don't send" option, so every allocation a test creates is
 * an email someone actually receives. The three cases that need an allocated
 * asset therefore share the single one the control test creates, rather than
 * making one each. Anything added here should reuse `allocated` too, and only
 * create a new allocation when the act of creating IS what is being tested.
 */
test.describe.serial('Asset allocation - negative cases', () => {

  // The asset allocated by the control test, reused by the cases below it.
  let allocated = '';

  test('control: a valid allocation still saves with client validation removed', async ({ page }) => {
    const allocationPage = new AssetAllocationPage(page);
    await allocationPage.loginAs('admin');
    await allocationPage.navigateTo();

    // Asserts the success flash, since expectRejected is not set.
    allocated = await createAllocation(allocationPage, {
      purpose: uniquePurpose('bypass control'),
      issuedDate: '2026-05-10',
    });
  });

  // Double allocation. The asset dropdown is the only thing standing between a
  // machine and being issued to two people at once, so once an asset has been
  // allocated it must drop out of that list. Reuses the control's allocation —
  // no new one is needed, since any allocated asset proves the point.
  test('an already-allocated asset is no longer offered for allocation', async ({ page }) => {
    const allocationPage = new AssetAllocationPage(page);
    await allocationPage.loginAs('admin');
    await allocationPage.navigateTo();
    await allocationPage.clickAddAssetAllocation();

    await expect(
      page.locator('#asset_allocation_asset_id option', { hasText: allocated }),
      `Asset ${allocated} is already allocated but is still offered for allocation.`
    ).toHaveCount(0);
  });

  // The return date cannot precede the issue date: an asset cannot come back
  // before it went out. Reuses the control's allocation, which is still active.
  // The edit is expected to be refused, so the asset stays allocated for the
  // test after this one and no deallocation mail goes out either.
  test('a received date before the issued date is rejected', async ({ page }) => {
    const allocationPage = new AssetAllocationPage(page);
    await allocationPage.loginAs('admin');
    await allocationPage.navigateTo();

    await allocationPage.openActiveAllocationForEdit(allocated);
    await allocationPage.disableClientValidation();
    await allocationPage.markAsReceived();
    // The control issued it on 2026-05-10; this returns it a month earlier.
    await allocationPage.fillReceivedDate('2026-04-10');
    await allocationPage.submit();
    await allocationPage.assertNotUpdated();
  });

  // CONFIRMED DEFECT (2026-09-24): the allocation saves with an empty purpose.
  // The field is labelled "Purpose *" and carries the HTML required attribute, so
  // the app does consider it mandatory — but that guard is client-side only and
  // the server accepts the blank value once it is removed. Same class as #1311.
  // Marked test.fail() so the suite stays green while the gap is open; it will
  // report "unexpectedly passed" once the server-side check is added.
  //
  // This one cannot reuse an allocation: submitting the form IS the test. While
  // the defect is open the submit succeeds, so it costs one real notification
  // per run — the only case here that does.
  test.fail('a blank purpose is rejected', async ({ page }) => {
    const allocationPage = new AssetAllocationPage(page);
    await allocationPage.loginAs('admin');
    await allocationPage.navigateTo();

    const serial = await createAllocation(allocationPage, {
      purpose: '',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await allocationPage.assertNotAllocated();

    // The decisive check. assertNotAllocated() only proves no success flash was
    // on screen, and flashes auto-dismiss — on a slow run an allocation that DID
    // go through can look refused. An asset that was really not allocated is
    // still offered in the dropdown.
    await allocationPage.navigateTo();
    await allocationPage.clickAddAssetAllocation();
    await expect(
      page.locator('#asset_allocation_asset_id option', { hasText: serial }),
      `Asset ${serial} was allocated with a blank purpose — it is no longer allocatable.`
    ).toHaveCount(1);
  });

  test('searching for an allocation that does not exist shows an empty table', async ({ page }) => {
    const allocationPage = new AssetAllocationPage(page);
    await allocationPage.loginAs('admin');
    await allocationPage.navigateTo();

    await allocationPage.searchAllocation(`no such allocation ${Date.now()}`);
    await expect(page.locator('table tbody')).toContainText(/no matching records|no data/i);
  });
});
