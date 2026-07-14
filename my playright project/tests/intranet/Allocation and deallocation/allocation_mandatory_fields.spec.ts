import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';

test('mandatory fields - allocation request must not be created without required data', async ({ page }) => {
  const allocationPage = new AllocationRequestPage(page);
  await allocationPage.loginAs('admin');
  await allocationPage.navigateTo();
  await allocationPage.clickCreateRequest();
  // Submit without filling any required fields
  await allocationPage.submit();
  // If the request is created successfully, validation was bypassed — fail the test
  await allocationPage.assertRequestNotCreated();
});
