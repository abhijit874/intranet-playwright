import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';

test('edit rejected request', async ({ page }) => {
  const allocationPage = new AllocationRequestPage(page);
  await allocationPage.loginAs('admin');
  await allocationPage.navigateTo();
  await allocationPage.clickRejectedTab();
  await allocationPage.searchRequests('Abhay Inamdar');
  await allocationPage.clickEditIconOnRow('Abhay Inamdar');
  await allocationPage.selectBillingCode('BC_M_USD_02');
  await allocationPage.submit();
  await allocationPage.assertRequestCreated();
});
