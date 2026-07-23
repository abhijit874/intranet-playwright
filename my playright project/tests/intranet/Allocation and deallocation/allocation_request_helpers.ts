import { Page } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';
import { AllocationRequestApprovalPage } from '../pages/AllocationRequestApprovalPage';
import { currentDateValue, pastDateValue } from '../utils/test_helpers';

// Derives the display name shown in the requests table from an "email (id)"
// value, e.g. "aditya.kumar@joshsoftware.com (891)" -> "Aditya Kumar".
export function employeeDisplayName(emailWithId: string): string {
  const local = emailWithId.split('@')[0];
  return local
    .split('.')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

// Signs out the current (admin) user and signs in as hr on the approval page —
// approving/rejecting is gated to hr while creating is done by admin.
export async function switchToHrApproval(page: Page): Promise<AllocationRequestApprovalPage> {
  await page.context().clearCookies();
  const ap = new AllocationRequestApprovalPage(page);
  await ap.loginAs('hr');
  await ap.navigateTo();
  return ap;
}

// Shared builders for the allocation/deallocation request specs.

export interface AllocationDetails {
  project: string;
  billingCode?: string;
  start?: string;
  end?: string;
  hours?: string;
  billingHours?: string;
}

// Fills the allocation half of the request form (assumes the Create Request form
// is open and the employee is already selected).
//
// Selecting the project auto-populates the allocation start/end dates with the
// project's valid in-range defaults, so those are left as-is unless a caller
// passes explicit (in-range) values — hardcoded dates can fall outside the range.
export async function fillAllocation(rp: AllocationRequestPage, d: AllocationDetails) {
  await rp.checkAllocationCheckbox();
  await rp.selectAllocationProject(d.project);
  // Billing code isn't asserted anywhere, so pick one at random unless specified.
  if (d.billingCode) {
    await rp.selectBillingCode(d.billingCode);
  } else {
    await rp.selectRandomBillingCode();
  }
  if (d.start) await rp.fillAllocationStart(d.start);
  if (d.end) await rp.fillAllocationEnd(d.end);
  await rp.fillAllocationHours(d.hours ?? '160');
  await rp.fillBillingHours(d.billingHours ?? '160');
}

// Deallocation needs an employee who actually HAS a current allocation — after
// selecting an employee and ticking Deallocation, the form lists their allocated
// projects, and for many employees that list is empty. So: pick a random
// employee, and if no project shows up to deallocate, pick another, until one
// with an allocated project is found. Ticks the first allocated project.
// Assumes the Create Request form is already open.
// Returns the chosen employee ("email (id)") and the ticked project.
export async function selectEmployeeWithAllocation(
  rp: AllocationRequestPage,
  maxAttempts = 8
): Promise<{ employee: string; project: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const employee = await rp.selectRandomEmployee();
    await rp.checkDeallocationCheckbox();
    const project = await rp.checkFirstDeallocationProjectIfAny();
    if (project) return { employee, project };
  }
  throw new Error(
    `Could not find a randomly-picked employee with a current allocation after ${maxAttempts} attempts.`
  );
}

// Creates a deallocation request for a random employee with a current
// allocation (see selectEmployeeWithAllocation). The deallocation date must not
// be in the future; it defaults to today.
export async function createDeallocationRequest(
  rp: AllocationRequestPage,
  date = currentDateValue()
): Promise<{ employee: string; project: string }> {
  await rp.clickCreateRequest();
  const chosen = await selectEmployeeWithAllocation(rp);
  await rp.setDeallocationDate(date);
  await rp.submit();
  await rp.assertRequestCreated();
  return chosen;
}

// Creates a reallocation request: deallocates the employee from a project they
// are currently on (deallocation date = yesterday) and reallocates them to the
// SAME project (allocation start = today, allocation end left at its auto-filled
// default).
//
// Picks the employee via selectEmployeeWithAllocation — a random employee,
// retried until one with a current allocation is found — and uses whichever
// project they're actually on, so both halves of the request act on the same
// project. Returns the chosen employee ("email (id)") and the project used.
export async function createReallocationRequest(
  rp: AllocationRequestPage
): Promise<{ employee: string; project: string }> {
  await rp.clickCreateRequest();
  const { employee: chosenEmployee, project } = await selectEmployeeWithAllocation(rp);

  await rp.setDeallocationDate(pastDateValue(1));

  // reallocate to the SAME project (start today, keep the default end date)
  await rp.checkAllocationCheckbox();
  await rp.selectAllocationProject(project);
  await rp.selectRandomBillingCode();
  await rp.fillAllocationStart(currentDateValue());
  await rp.fillAllocationHours('160');
  await rp.fillBillingHours('160');

  await rp.submit();
  await rp.assertRequestCreated();
  return { employee: chosenEmployee, project };
}

// Opens the Create Request form, selects the employee, fills an allocation and
// submits, asserting the request was created.
export async function createAllocationRequest(
  rp: AllocationRequestPage,
  employee: string,
  details: AllocationDetails
) {
  await rp.clickCreateRequest();
  await rp.selectEmployee(employee);
  await fillAllocation(rp, details);
  await rp.submit();
  await rp.assertRequestCreated();
}
