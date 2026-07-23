import { test } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';
import { AllocationRequestApprovalPage } from '../pages/AllocationRequestApprovalPage';
import { PendingFeedbackPage } from '../pages/PendingFeedbackPage';
import {
  createAllocationRequest,
  createDeallocationRequest,
  createReallocationRequest,
  employeeDisplayName,
  switchToHrApproval,
} from './allocation_request_helpers';

// Self-contained: admin creates an allocation request, then hr approves it.
test('approve allocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await rp.clickCreateRequest();

  // Approval rejects a duplicate allocation, so a fixed employee/project pair only
  // works once — after that the employee is already on that project. A random
  // pairing is very unlikely to collide with an existing allocation, which makes
  // this re-runnable.
  const employee = await rp.selectRandomEmployee();
  await rp.checkAllocationCheckbox();
  await rp.selectRandomAllocationProject();
  await rp.selectRandomBillingCode();
  await rp.fillAllocationHours('160');
  await rp.fillBillingHours('160');
  await rp.submit();
  await rp.assertRequestCreated();

  const name = employeeDisplayName(employee);
  const ap = await switchToHrApproval(page);
  await ap.searchRequests(name);
  await ap.clickViewOnRow(name, 'allocation');
  await ap.approveAllocationRequest();
  await ap.assertRequestApproved();
});

// Self-contained: admin creates an allocation request, then hr rejects it.
test('reject allocation request', async ({ page }) => {
  const employee = 'akash.barde@joshsoftware.com (874)';
  const name = employeeDisplayName(employee);

  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await createAllocationRequest(rp, employee, { project: 'Innovation lab' });

  const ap = await switchToHrApproval(page);
  await ap.searchRequests(name);
  await ap.clickViewOnRow(name, 'allocation');
  await ap.clickRejectButton();
  await ap.fillRejectReason('this is test');
  await ap.confirmReject();
  await ap.assertRequestRejected();
});

// Self-contained: admin creates a request, hr rejects it, then admin opens the
// rejected request and edits it (changes the billing code) and resubmits.
test('edit rejected request', async ({ page }) => {
  const employee = 'ankita.solanki@joshsoftware.com (933)';
  const name = employeeDisplayName(employee);

  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await createAllocationRequest(rp, employee, { project: 'Innovation lab' });

  // hr rejects it
  const ap = await switchToHrApproval(page);
  await ap.searchRequests(name);
  await ap.clickViewOnRow(name, 'allocation');
  await ap.clickRejectButton();
  await ap.fillRejectReason('reject to edit');
  await ap.confirmReject();
  await ap.assertRequestRejected();

  // admin edits the rejected request
  await page.context().clearCookies();
  const rp2 = new AllocationRequestPage(page);
  await rp2.loginAs('admin');
  const ap2 = new AllocationRequestApprovalPage(page);
  await ap2.navigateTo();
  await ap2.clickRejectedTab();
  await ap2.searchRequests(name);
  await ap2.clickEditIconOnRow(name);
  // modify the editable fields (billing code + hours) and resubmit
  await rp2.selectBillingCode('BC_M_USD_02');
  await rp2.fillAllocationHours('120');
  await rp2.fillBillingHours('120');
  await rp2.submit();
  await rp2.assertRequestCreated();
});

// Self-contained: admin creates a deallocation request, hr fills the resulting
// pending performance feedback for that employee/project, then hr approves the
// deallocation. (Approving a deallocation is blocked until its feedback is filled.)
test('approve deallocation request', async ({ page }) => {
  // 1. admin creates a deallocation request (date must not be in the future)
  //    for a random employee who actually has an allocated project — employees
  //    without one are skipped until a suitable one is found.
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  const { employee, project } = await createDeallocationRequest(rp);
  const name = employeeDisplayName(employee);

  // 2. hr fills the pending feedback for that employee + deallocated project
  await page.context().clearCookies();
  const fb = new PendingFeedbackPage(page);
  await fb.loginAs('hr');
  await fb.navigateToPendingFeedback();
  await fb.openFeedbackFormFor(name, project);
  await fb.fillFeedbackForm();
  await fb.submit();
  await fb.assertSubmitted();

  // 3. hr approves the deallocation
  const ap = new AllocationRequestApprovalPage(page);
  await ap.navigateTo();
  await ap.searchRequests(name);
  await ap.clickViewOnRow(name, 'deallocation');
  await ap.approveRequest(true);
  await ap.assertRequestApproved();
});

// Self-contained: admin creates a reallocation request (deallocate + reallocate
// the same project), then hr approves it directly. Unlike a plain deallocation,
// a reallocation does not require filling a feedback form first.
test('approve reallocation request', async ({ page }) => {
  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  // Random employee that has an allocation; both halves act on that same project.
  const { employee } = await createReallocationRequest(rp);
  const name = employeeDisplayName(employee);

  const ap = await switchToHrApproval(page);
  await ap.searchRequests(name);
  await ap.clickViewOnRow(name, 'allocation'); // reallocation shows as "Allocation Deallocation"
  await ap.clickApproveButton();
  await ap.assertRequestApproved();
});

// Self-contained: admin creates a request and, while it is still pending (not yet
// approved), cancels it themselves.
test('cancel pending request', async ({ page }) => {
  const employee = 'akshay.khairnar@joshsoftware.com (851)';
  const name = employeeDisplayName(employee);

  const rp = new AllocationRequestPage(page);
  await rp.loginAs('admin');
  await rp.navigateTo();
  await createAllocationRequest(rp, employee, { project: 'Innovation lab' });

  // still on the admin session — cancel the pending request
  const ap = new AllocationRequestApprovalPage(page);
  await ap.navigateTo();
  await ap.searchRequests(name);
  await ap.clickCancelIconOnRow(name, 'allocation');
  await ap.fillCancelReason('cancel test - request no longer needed');
  await ap.confirmCancel();
  await ap.assertRequestCancelled();
});
