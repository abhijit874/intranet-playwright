import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';
import { currentDateValue } from '../utils/test_helpers';
import { createReallocationRequest, fillAllocation } from './allocation_request_helpers';

// The deallocation date must not be in the future — use today.
const DEALLOCATION_DATE = currentDateValue();

test('create allocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await rp.clickCreateRequest();
  await rp.selectEmployee('aditya.kumar@joshsoftware.com (891)');
  await fillAllocation(rp, { project: 'ERP AI Project' });
  await rp.submit();
  await rp.assertRequestCreated();
});

test('create deallocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await rp.clickCreateRequest();
  await rp.selectEmployee('abhijit.kasbe@joshsoftware.com (210)');
  await rp.checkDeallocationCheckbox();
  // deallocate from whichever project the employee is currently on
  await rp.checkFirstDeallocationProject();
  await rp.setDeallocationDate(DEALLOCATION_DATE);
  await rp.submit();
  await rp.assertRequestCreated();
});

test('create allocation and deallocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await rp.clickCreateRequest();
  await rp.selectEmployee('amar.jadhav@joshsoftware.com (595)');
  await fillAllocation(rp, { project: 'Innovation lab' });
  await rp.checkDeallocationCheckbox();
  await rp.checkFirstDeallocationProject();
  await rp.setDeallocationDate(DEALLOCATION_DATE);
  await rp.submit();
  await rp.assertRequestCreated();
});

// Reallocation: deallocate the employee from a project they are currently on
// (deallocation date = yesterday), then reallocate them to the SAME project
// (allocation start = today, i.e. after the deallocation date; allocation end is
// left at the field's auto-filled default).
test('create reallocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await createReallocationRequest(rp, 'aman.pathan@joshsoftware.com (994)');
});
