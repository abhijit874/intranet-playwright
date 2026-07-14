import { test, expect } from '@playwright/test';
import { ContributionsApprovalPage } from '../pages/activities/ContributionsApprovalPage';

const DEDUCTION_AMOUNT = 60000;
const DEDUCTION_REASON = 'an amount is already paid'; // valid: >= 20 chars
const BLANK_REASON = ''; // invalid: required field left empty
const SHORT_REASON = 'too short'; // invalid: non-blank but < 20 chars

// Exact text of the native alert() popups the app raises for invalid input.
const OVER_ALLOCATION_ALERT = 'Deduction amount must be less than or equal to approved amount.';
const REQUIRED_FIELDS_ALERT = 'Please fill both Deduction Amount and Deduction Reason.';
const SHORT_REASON_ALERT = 'Deduction Reason must be at least 20 characters.';

const RECORD = {
  title: 'Judge at PICT Hackathon',
  date: '01/04/2026',
  employeeName: 'Satvik Pare',
  category: 'Registered Volunteers',
  subcategory: 'Josh Events',
};

test.describe('Approve with amount deduction', () => {
  // Happy flow — an eligible contribution is approved with a deduction applied.
  test('approves an eligible activity with a deduction', async ({ page }) => {
    const approvalPage = new ContributionsApprovalPage(page);
    await approvalPage.loginAs('hr');
    await approvalPage.navigateToContributionsApproval();
    await approvalPage.openActionModal(RECORD);
    await approvalPage.fillDeductionAmount(String(DEDUCTION_AMOUNT));
    await approvalPage.fillDeductionReason(DEDUCTION_REASON);
    await approvalPage.clickApproveInModal();
  });

  // Validation — a deduction greater than the allocated amount raises a native
  // alert popup (dismissed with OK).
  test('deduction amount must not be greater than the allocated amount', async ({ page }) => {
    const approvalPage = new ContributionsApprovalPage(page);
    await approvalPage.loginAs('hr');
    await approvalPage.navigateToContributionsApproval();
    await approvalPage.openActionModal(RECORD);

    const allocated = await approvalPage.getAllocatedAmount();
    await approvalPage.fillDeductionAmount(String(allocated + 1)); // over allocation
    await approvalPage.fillDeductionReason(DEDUCTION_REASON); // valid reason, so only the amount is invalid

    const alertMessage = await approvalPage.approveAndCaptureAlert();
    expect(alertMessage).toContain(OVER_ALLOCATION_ALERT);
  });

  // Validation — leaving the deduction reason blank (with a valid amount) raises
  // a native alert popup requiring both fields (dismissed with OK).
  test('deduction reason is required', async ({ page }) => {
    const approvalPage = new ContributionsApprovalPage(page);
    await approvalPage.loginAs('hr');
    await approvalPage.navigateToContributionsApproval();
    await approvalPage.openActionModal(RECORD);

    await approvalPage.fillDeductionAmount(String(DEDUCTION_AMOUNT)); // valid amount
    await approvalPage.fillDeductionReason(BLANK_REASON); // reason left empty

    const alertMessage = await approvalPage.approveAndCaptureAlert();
    expect(alertMessage).toContain(REQUIRED_FIELDS_ALERT);
  });

  // Validation — a non-blank deduction reason shorter than 20 characters raises a
  // native alert popup (dismissed with OK).
  test('deduction reason must be at least 20 characters', async ({ page }) => {
    const approvalPage = new ContributionsApprovalPage(page);
    await approvalPage.loginAs('hr');
    await approvalPage.navigateToContributionsApproval();
    await approvalPage.openActionModal(RECORD);

    // The app validates the amount before the reason length, so the amount must
    // be valid (<= approved) to actually reach the reason-length check.
    const allocated = await approvalPage.getAllocatedAmount();
    await approvalPage.fillDeductionAmount(String(allocated)); // valid amount (== approved)
    await approvalPage.fillDeductionReason(SHORT_REASON); // non-blank but < 20 chars

    const alertMessage = await approvalPage.approveAndCaptureAlert();
    expect(alertMessage).toContain(SHORT_REASON_ALERT);
  });
});
