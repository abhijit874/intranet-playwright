import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';

test('create deallocation request', async ({ page }) => {
  const allocationPage = new AllocationRequestPage(page);
  await allocationPage.loginAs('admin');
  await allocationPage.navigateTo();
  await allocationPage.clickCreateRequest();
  await allocationPage.selectEmployee('balaji.suchendra@joshsoftware.com (817)');
  await allocationPage.checkDeallocationCheckbox();
  await allocationPage.checkDeallocationProjectByText('AI drones');
  await allocationPage.setDeallocationDate('2026-05-10');
  await allocationPage.submit();
  await allocationPage.assertRequestCreated();
});
