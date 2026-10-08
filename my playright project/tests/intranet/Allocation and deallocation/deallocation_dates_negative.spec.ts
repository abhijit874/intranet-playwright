import { test, expect, Page } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';
import { AllocationRequestApprovalPage } from '../pages/AllocationRequestApprovalPage';
import {
  selectEmployeeWithAllocation,
  employeeDisplayName,
  switchToHrApproval,
} from './allocation_request_helpers';
import { stripClientValidation, futureDateValue } from '../utils/test_helpers';

/**
 * Deallocation date rules.
 *
 * The rule is a window: the deallocation date must be AFTER the project's start
 * date and NOT AFTER today. A date outside it describes something that never
 * happened — someone leaving a project before it existed, or a departure
 * recorded in advance.
 *
 * Where the rule lives is the thing worth knowing, and it is not where a tester
 * would look first. The create form does not check it at all: #deallocation_date
 * carries no min and no max, and the server accepts anything on submit. Both
 * bounds are enforced at APPROVAL instead, so an out-of-window request can be
 * raised and sits in the queue until someone tries to approve it and is refused.
 *
 * These tests therefore submit and then approve, asserting the approval-time
 * error. Asserting only on the create step would record the opposite of the
 * truth — that the app accepts these dates — and would go green even if the
 * approval guard were removed, which is the guard that actually protects the
 * data.
 *
 * MAIL AND STATE COST — read before running.
 * Every test here creates a real request, which notifies the approver. There is
 * no way to exercise an approval-time rule without one. Each test cancels its
 * own request afterwards (cancelling sends no mail), so nothing is left pending,
 * but the creation notification cannot be avoided. Approvals are clicked without
 * ticking the "send email" box, so the employee is never mailed.
 *
 * Nothing here can change real data: both cases are expected to be REFUSED at
 * approval, so no employee is ever actually deallocated.
 */
test.describe.serial('Deallocation date rules', () => {

  // Raises a deallocation request for a random employee who currently has one,
  // dated `date`, and returns their display name so the caller can find the row.
  async function raiseDeallocation(page: Page, date: string) {
    const rp = new AllocationRequestPage(page);
    await rp.loginAs('admin');
    await rp.navigateTo();
    await rp.clickCreateRequest();
    const { employee, project } = await selectEmployeeWithAllocation(rp);
    await stripClientValidation(page);
    await rp.setDeallocationDate(date);
    await rp.submit();
    // The create step is expected to succeed — that is the gap being documented.
    await rp.assertRequestCreated();
    return { name: employeeDisplayName(employee), project };
  }

  // Cancels the request just raised, so the queue is left as it was found.
  async function cancelRequestFor(page: Page, name: string) {
    await page.context().clearCookies();
    const ap = new AllocationRequestApprovalPage(page);
    await ap.loginAs('admin');
    await ap.navigateTo();
    const row = page.locator('#table-pending tbody tr').first();
    await expect(
      row,
      `the newest pending request is not the one this test raised for ${name}`
    ).toContainText(name);
    await row.locator('button[data-bs-target="#cancelRequestModal"]').first().click();
    await expect(page.locator('#cancelRequestModal')).toBeVisible({ timeout: 10_000 });
    await ap.fillCancelReason('Raised by an automated test; cancelling.');
    await ap.confirmCancel();
    await ap.assertRequestCancelled();
  }

  test('a deallocation dated before the project started cannot be approved', async ({ page }) => {
    // Far enough back to precede any project in the system.
    const { name } = await raiseDeallocation(page, '2000-01-01');

    const ap = await switchToHrApproval(page);
    await ap.clickViewOnRow(name, 'deallocation');
    await ap.approveRequest(false);

    await expect(page.locator('#flashes')).toContainText(
      /End date should not be less than project start date/i
    );

    await cancelRequestFor(page, name);
  });

  test('a deallocation dated in the future cannot be approved', async ({ page }) => {
    const { name } = await raiseDeallocation(page, futureDateValue(30));

    const ap = await switchToHrApproval(page);
    await ap.clickViewOnRow(name, 'deallocation');
    await ap.approveRequest(false);

    await expect(page.locator('#flashes')).toContainText(
      /End date shouldn't be greater than today/i
    );

    await cancelRequestFor(page, name);
  });
});
