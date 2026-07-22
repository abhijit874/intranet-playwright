import { test, expect } from '@playwright/test';
import { ContributionsApprovalPage } from '../pages/activities/ContributionsApprovalPage';
import { createAndApproveContribution } from './contributor_helpers';

// Opens a pending record's action modal and asserts whichever response the
// system gives: an eligible record is approved (happy flow); an over-quota
// record shows the "...exceed the allowed quota in this category." message and
// cannot be approved.
//
// The record to approve is chosen in three ways, in order:
//   1. Env override — approve exactly the record you fed manually:
//        APPROVE_TITLE=... [APPROVE_EMPLOYEE=... APPROVE_DATE=yyyy/mm/dd
//        APPROVE_CATEGORY=... APPROVE_SUBCATEGORY=...]
//   2. Existing data — any record already pending in the approval queue.
//   3. Self-contained fallback — the queue is empty, so create a contribution
//      (as a grade-eligible employee) and approve that exact record as hr.
test('approve activity — eligible is approved, over-quota shows the message', async ({ page }) => {
  const approvalPage = new ContributionsApprovalPage(page);

  // --- Mode 1: manually fed record via env vars -----------------------------
  const manualTitle = process.env.APPROVE_TITLE;
  if (manualTitle) {
    await approvalPage.loginAs('hr');
    await approvalPage.navigateToContributionsApproval();
    const outcome = await approvalPage.approveContribution({
      title: manualTitle,
      date: process.env.APPROVE_DATE ?? '',
      employeeName: process.env.APPROVE_EMPLOYEE ?? '',
      category: process.env.APPROVE_CATEGORY ?? '',
      subcategory: process.env.APPROVE_SUBCATEGORY ?? '',
    });
    expect(['approved', 'quota-blocked']).toContain(outcome);
    return;
  }

  // --- Mode 2: approve whatever is already pending --------------------------
  await approvalPage.loginAs('hr');
  await approvalPage.navigateToContributionsApproval();
  const existingOutcome = await approvalPage.approveFirstPending();
  if (existingOutcome) {
    expect(['approved', 'quota-blocked']).toContain(existingOutcome);
    return;
  }

  // --- Mode 3: queue empty — create a record, then approve it ---------------
  const { outcome } = await createAndApproveContribution(page);
  expect(['approved', 'quota-blocked']).toContain(outcome);
});

// ---------------------------------------------------------------------------
// Approval with an amount deduction, and the validation around it.
// The record is chosen like above: the APPROVE_* env override when set,
// otherwise the first pending record whose modal actually offers the deduction
// fields. When neither exists the tests skip — a deduction needs a record with
// an allocated amount, which cannot be conjured from an empty queue.
// ---------------------------------------------------------------------------

const DEDUCTION_REASON = 'an amount is already paid'; // valid: >= 20 chars
const BLANK_REASON = ''; // invalid: required field left empty
const SHORT_REASON = 'too short'; // invalid: non-blank but < 20 chars

// Exact text of the native alert() popups the app raises for invalid input.
const OVER_ALLOCATION_ALERT = 'Deduction amount must be less than or equal to approved amount.';
const REQUIRED_FIELDS_ALERT = 'Please fill both Deduction Amount and Deduction Reason.';
const SHORT_REASON_ALERT = 'Deduction Reason must be at least 20 characters.';

test.describe('Approve with amount deduction', () => {
  // Signs in as hr and opens a deduction-capable action modal (env-override
  // record if set, else the first suitable pending record). Skips the calling
  // test when no such record is available.
  async function openDeductibleModal(page: import('@playwright/test').Page) {
    const approvalPage = new ContributionsApprovalPage(page);
    await approvalPage.loginAs('hr');
    await approvalPage.navigateToContributionsApproval();

    const manualTitle = process.env.APPROVE_TITLE;
    if (manualTitle) {
      await approvalPage.openActionModal({
        title: manualTitle,
        date: process.env.APPROVE_DATE ?? '',
        employeeName: process.env.APPROVE_EMPLOYEE ?? '',
        category: process.env.APPROVE_CATEGORY ?? '',
        subcategory: process.env.APPROVE_SUBCATEGORY ?? '',
      });
      return approvalPage;
    }

    const modal = await approvalPage.openFirstDeductibleModal();
    test.skip(
      !modal,
      'No pending record with deduction fields available — feed one via APPROVE_TITLE.'
    );
    return approvalPage;
  }

  // Happy flow — an eligible contribution is approved with a deduction applied.
  // The amount is derived from the record's own allocation so it is always valid.
  test('approves an eligible activity with a deduction', async ({ page }) => {
    const approvalPage = await openDeductibleModal(page);
    const allocated = await approvalPage.getAllocatedAmount();
    await approvalPage.fillDeductionAmount(String(Math.ceil(allocated / 2)));
    await approvalPage.fillDeductionReason(DEDUCTION_REASON);
    await approvalPage.clickApproveInModal();
  });

  // Validation — a deduction greater than the allocated amount raises a native
  // alert popup (dismissed with OK).
  test('deduction amount must not be greater than the allocated amount', async ({ page }) => {
    const approvalPage = await openDeductibleModal(page);

    const allocated = await approvalPage.getAllocatedAmount();
    await approvalPage.fillDeductionAmount(String(allocated + 1)); // over allocation
    await approvalPage.fillDeductionReason(DEDUCTION_REASON); // valid reason, so only the amount is invalid

    const alertMessage = await approvalPage.approveAndCaptureAlert();
    expect(alertMessage).toContain(OVER_ALLOCATION_ALERT);
  });

  // Validation — leaving the deduction reason blank (with a valid amount) raises
  // a native alert popup requiring both fields (dismissed with OK).
  test('deduction reason is required', async ({ page }) => {
    const approvalPage = await openDeductibleModal(page);

    const allocated = await approvalPage.getAllocatedAmount();
    await approvalPage.fillDeductionAmount(String(allocated)); // valid amount (== approved)
    await approvalPage.fillDeductionReason(BLANK_REASON); // reason left empty

    const alertMessage = await approvalPage.approveAndCaptureAlert();
    expect(alertMessage).toContain(REQUIRED_FIELDS_ALERT);
  });

  // Validation — a non-blank deduction reason shorter than 20 characters raises a
  // native alert popup (dismissed with OK).
  test('deduction reason must be at least 20 characters', async ({ page }) => {
    const approvalPage = await openDeductibleModal(page);

    // The app validates the amount before the reason length, so the amount must
    // be valid (<= approved) to actually reach the reason-length check.
    const allocated = await approvalPage.getAllocatedAmount();
    await approvalPage.fillDeductionAmount(String(allocated)); // valid amount (== approved)
    await approvalPage.fillDeductionReason(SHORT_REASON); // non-blank but < 20 chars

    const alertMessage = await approvalPage.approveAndCaptureAlert();
    expect(alertMessage).toContain(SHORT_REASON_ALERT);
  });
});
