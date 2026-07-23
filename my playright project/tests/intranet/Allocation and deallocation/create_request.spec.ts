import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';
import { currentDateValue } from '../utils/test_helpers';
import {
  createDeallocationRequest,
  createReallocationRequest,
  selectEmployeeWithAllocation,
} from './allocation_request_helpers';

// The deallocation date must not be in the future — use today.
const DEALLOCATION_DATE = currentDateValue();

test('create allocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await rp.clickCreateRequest();
  // This test only creates a pending request (nothing is approved), so the
  // employee/project don't have to satisfy any allocation state — pick both at
  // random so requests spread across the data.
  await rp.selectRandomEmployee();
  await rp.checkAllocationCheckbox();
  await rp.selectRandomAllocationProject();
  await rp.selectRandomBillingCode();
  await rp.fillAllocationHours('160');
  await rp.fillBillingHours('160');
  await rp.submit();
  await rp.assertRequestCreated();
});

test('create deallocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  // Picks a random employee, and keeps picking until one with an allocated
  // project turns up — many employees have nothing to deallocate.
  await createDeallocationRequest(rp, DEALLOCATION_DATE);
});

test('create allocation and deallocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await rp.clickCreateRequest();
  // Deallocation half: a random employee who actually has a project to leave.
  const { project: deallocatedProject } = await selectEmployeeWithAllocation(rp);
  await rp.setDeallocationDate(DEALLOCATION_DATE);
  // Allocation half: a random project — retried once if it happens to match the
  // project being deallocated (the app rejects duplicate allocations).
  await rp.checkAllocationCheckbox();
  let allocationProject = await rp.selectRandomAllocationProject();
  if (allocationProject === deallocatedProject) {
    allocationProject = await rp.selectRandomAllocationProject();
  }
  await rp.selectRandomBillingCode();
  await rp.fillAllocationHours('160');
  await rp.fillBillingHours('160');
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
  // Picks a random employee that actually has an allocation, and deallocates +
  // reallocates them on that same project.
  await createReallocationRequest(rp);
});
