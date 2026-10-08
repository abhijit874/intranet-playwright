import { test, expect } from '@playwright/test';
import { AllocationRequestPage } from '../pages/AllocationRequestPage';
import { stripClientValidation } from '../utils/test_helpers';

/**
 * Allocation / deallocation requests — date rules.
 *
 * A request's dates are bounded by the project's own: an employee cannot be
 * allocated to a project before it starts or after it ends. Selecting a project
 * auto-fills the allocation start (today) and end (the project's end date), so
 * the happy path never leaves the valid range and none of this is exercised.
 *
 * MAIL SIDE EFFECT — every case here is expected to be REFUSED, and a refused
 * request is never created, so nothing below sends a notification. There is
 * deliberately no control test: a control would have to create a real request
 * (and mail someone) to prove anything. Instead each test asserts the specific
 * error the app reports, which a test that never reached the server could not
 * produce — so a silently-broken form cannot make these pass.
 *
 * The one exception is marked and explained where it appears.
 *
 * The project is picked at random, so no test depends on a particular project's
 * dates: out-of-range values are chosen far enough out (the year 2000, the year
 * 2099) to be invalid for any project, and the in-range reversal below is built
 * from the form's own auto-filled values.
 */
test.describe('Allocation requests - date rules', () => {

  async function openAllocationForm(page: import('@playwright/test').Page) {
    const rp = new AllocationRequestPage(page);
    await rp.loginAs('admin');
    await rp.navigateTo();
    await rp.clickCreateRequest();
    await rp.selectRandomEmployee();
    await rp.checkAllocationCheckbox();
    const project = await rp.selectRandomAllocationProject();
    await rp.selectRandomBillingCode();
    await rp.fillAllocationHours('160');
    await rp.fillBillingHours('160');
    return { rp, project };
  }

  test('an allocation cannot start before the project starts', async ({ page }) => {
    const { rp } = await openAllocationForm(page);

    await stripClientValidation(page);
    await rp.fillAllocationStart('2000-01-01');
    await rp.submit();

    await expect(page.locator('#flashes')).toContainText(
      /Allocation start date .* should not be less than project start date/i
    );
    await rp.assertRequestNotCreated();
  });

  // CONFIRMED DEFECT (2026-09-28): the request is created with an allocation end
  // date years past the project's own end. The START side of the same rule IS
  // enforced server-side (the test above), so this is a one-sided check: the end
  // date is guarded only by the max attribute on the input, which devtools or a
  // direct POST bypasses. Same class as #1311.
  //
  // It is not caught downstream either. Approval re-validates a request's dates —
  // a back-dated DEALLOCATION is refused at that point with "End date should not
  // be less than project start date" — but an allocation ending past the project
  // end passes approval and takes effect, leaving a live allocation that outlives
  // its project. Verified end to end on 2026-09-28.
  //
  // MAIL COST: while this defect is open the submit succeeds, so this test
  // creates a real request — and a notification — on every run. It is the only
  // test in this file that does. Cancel the request it leaves behind, or skip
  // this test, if that matters more than the coverage.
  //
  // Marked test.fail() so the suite stays green while the gap is open; it will
  // report "unexpectedly passed" once the server-side check is added.
  test.fail('an allocation cannot end after the project ends', async ({ page }) => {
    const { rp } = await openAllocationForm(page);

    // The end field carries max="<project end>", so the browser blocks this on
    // its own — strip that first, or the submit never reaches the server and the
    // test proves nothing about the rule.
    await stripClientValidation(page);
    await rp.fillAllocationEnd('2099-12-31');
    await rp.submit();

    await expect(page.locator('#flashes')).toContainText(
      /Allocation end date .* should not be (greater|more) than project end date/i
    );
    await rp.assertRequestNotCreated();
  });

  test('an allocation cannot end before it starts', async ({ page }) => {
    const { rp } = await openAllocationForm(page);

    // Both values come from the form itself — start is today, end is the
    // project's end date — so swapping them gives a reversed range that is still
    // inside the project's window. That isolates the start-vs-end rule from the
    // project-bounds rules above.
    const start = await page.locator('#allocation_start').inputValue();
    const end = await page.locator('#allocation_end').inputValue();
    expect(start, 'the form did not auto-fill an allocation start date').toBeTruthy();
    expect(end, 'the form did not auto-fill an allocation end date').toBeTruthy();

    await stripClientValidation(page);
    await rp.fillAllocationStart(end);
    await rp.fillAllocationEnd(start);
    await rp.submit();

    await expect(page.locator('#flashes')).toContainText(
      /Allocation end date should not be less than allocation start date/i
    );
    await rp.assertRequestNotCreated();
  });
});
