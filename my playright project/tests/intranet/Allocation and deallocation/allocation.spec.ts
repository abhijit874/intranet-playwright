import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';

test('create allocation request', async ({ page }) => {
  const allocationPage = new AllocationRequestPage(page);
  await allocationPage.loginAs('admin');
  await allocationPage.navigateTo();
  await allocationPage.clickCreateRequest();
  await allocationPage.selectEmployee('balaji.suchendra@joshsoftware.com (817)');
  await allocationPage.checkAllocationCheckbox();
  await allocationPage.selectAllocationProject('AI drones');
  await allocationPage.selectBillingCode('BC_M_INR_01');
  await allocationPage.fillAllocationStart('2026-05-10');
  await allocationPage.fillAllocationEnd('2026-11-30');
  await allocationPage.fillAllocationHours('160');
  await allocationPage.fillBillingHours('160');
  await allocationPage.submit();
});
