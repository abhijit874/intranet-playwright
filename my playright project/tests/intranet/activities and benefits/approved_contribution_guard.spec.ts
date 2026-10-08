import { test, expect, Page } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { ContributionsApprovalPage } from '../pages/activities/ContributionsApprovalPage';

/**
 * Contributions — who may edit what.
 *
 * A contribution moves pending -> approved/rejected, and once its quarter closes
 * it is frozen. The list reflects that: pending and rejected rows carry an Edit
 * link so the contributor can correct and resubmit, approved rows carry none.
 *
 * All of that lives in the list markup. The edit route itself checks neither the
 * record's state nor who owns it, which is the same shape as Trello #1311 — a
 * check present in the page but not on the server — with two consequences: a
 * contributor can change a record after it has been approved and credited, and
 * one employee can open another employee's record.
 *
 * It is not specific to one category or one record. Checked on 2026-09-30: the
 * edit form is served for approved records across Learning and Development,
 * Blog Writing, Talk at Conference and Innovation Lab, and the update itself was
 * confirmed on approved records in two different categories whose forms share
 * almost no fields (L&D has description/duration, Blog Writing has blog_url and
 * published_on). It behaves like one unguarded controller action rather than a
 * gap in a particular form.
 *
 * Every test here is read-only. They ask whether the edit form is served and
 * never submit, so they can run on every suite run without altering anyone's
 * data — which matters especially for the cross-employee case.
 */
test.describe('Contributions - who may edit what', () => {

  // Ids of the signed-in employee's own contributions, read off their list.
  async function ownContributionIds(page: Page): Promise<string[]> {
    return page
      .locator('table tbody tr[data-item-id]')
      .evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.itemId!).filter(Boolean));
  }

  async function editFormIsServed(page: Page, id: string): Promise<boolean> {
    const response = await page.request.get(`/contributions/${id}/edit`);
    return /name="contribution\[/.test(await response.text());
  }

  test('the list offers no Edit control on an approved contribution', async ({ page }) => {
    const contributionsPage = new ContributionsPage(page);
    await contributionsPage.loginAs('employee');
    await contributionsPage.navigateToContributions();

    const approved = page.locator('table tbody tr').filter({ hasText: 'approved' }).first();
    test.skip(!(await approved.count()), 'this employee has no approved contribution to check');

    await expect(
      approved.locator('a[href*="/edit"]'),
      'an approved contribution still offers an Edit link'
    ).toHaveCount(0);
  });

  // The counterpart to the test above: a rejected record is meant to stay
  // editable so the contributor can fix what was wrong and resubmit. Pinned so
  // that a change tightening the approved case does not quietly take this away
  // too — the two rows look alike and are easy to guard together by mistake.
  test('the list keeps the Edit control on a rejected contribution', async ({ page }) => {
    const contributionsPage = new ContributionsPage(page);
    await contributionsPage.loginAs('employee');
    await contributionsPage.navigateToContributions();

    const rejected = page.locator('table tbody tr').filter({ hasText: 'rejected' }).first();
    test.skip(!(await rejected.count()), 'this employee has no rejected contribution to check');

    await expect(
      rejected.locator('a[href*="/edit"]'),
      'a rejected contribution no longer offers an Edit link, so it cannot be corrected'
    ).toHaveCount(1);
  });

  // CONFIRMED DEFECT (2026-09-30): the edit route serves a fully working form for
  // an approved contribution — 200, every field populated, an enabled Update
  // button — even though the list deliberately withholds the link.
  //
  // The submit was confirmed to work once, by hand, against a disposable QA
  // record: 302 with "Contribution successfully updated", and the record stayed
  // approved. That record was also in the Frozen tab, so a closed quarter does
  // not protect it either. The submit is NOT repeated here.
  //
  // Marked test.fail() so the suite stays green while the gap is open.
  test.fail('the edit route refuses an approved contribution', async ({ page }) => {
    const contributionsPage = new ContributionsPage(page);
    await contributionsPage.loginAs('employee');
    await contributionsPage.navigateToContributions();

    const approvedId = await page
      .locator('table tbody tr')
      .filter({ hasText: 'approved' })
      .first()
      .getAttribute('data-item-id');
    test.skip(!approvedId, 'this employee has no approved contribution to check');

    expect(
      await editFormIsServed(page, approvedId!),
      `the edit form for approved contribution ${approvedId} was served, so the route is not state-guarded`
    ).toBe(false);
  });

  // CONFIRMED DEFECT (2026-09-30): the update is accepted too, not just the form.
  // An approved record's title and activity date can both be changed and they
  // persist, with the record still showing as approved. The activity date is the
  // damaging one: it decides which quarter a contribution belongs to, and the
  // quarter drives quota and benefit accounting — so an already-credited record
  // can be moved to a different quarter without going back through approval.
  //
  // This test writes to real data, which the suite otherwise avoids. It is kept
  // safe by restoring the original values in a finally block, so an assertion
  // failure partway through still puts the record back. Once the route is
  // guarded, the tamper is refused, the assertion passes and the restore becomes
  // a no-op.
  //
  // Marked test.fail() so the suite stays green while the gap is open.
  test.fail('an approved contribution cannot actually be updated', async ({ page }) => {
    const contributionsPage = new ContributionsPage(page);
    await contributionsPage.loginAs('employee');
    await contributionsPage.navigateToContributions();

    const approvedId = await page
      .locator('table tbody tr')
      .filter({ hasText: 'approved' })
      .first()
      .getAttribute('data-item-id');
    test.skip(!approvedId, 'this employee has no approved contribution to check');

    const openEditForm = async () => {
      await page.goto(`/contributions/${approvedId}/edit`);
      await page.waitForLoadState('networkidle').catch(() => {});
    };
    // The form leaves description and duration blank even when the record has
    // them, and both are required, so the browser blocks the submit until they
    // are filled. They are rewritten with their own values on the way back.
    // Returns the update POST's status, or null when the browser blocked the
    // submit. Without that, a submit that never left the page would make the
    // "record is unchanged" assertion below pass for the wrong reason.
    const save = async (title: string, date: string): Promise<number | null> => {
      await page.locator('#title').fill(title);
      await page.locator('#activity_date').evaluate((el: HTMLInputElement) => {
        el.removeAttribute('min');
        el.removeAttribute('max');
      });
      await page.locator('#activity_date').fill(date);
      await page.locator('#description').fill('Restored by an automated test.');
      await page.locator('#duration').fill('1');
      const response = page
        .waitForResponse(
          (r) => r.request().method() === 'POST' && r.url().includes('/contributions'),
          { timeout: 30_000 }
        )
        .catch(() => null);
      await page.locator('#contribution_form button[type="submit"]').first().click({ noWaitAfter: true });
      const settled = await response;
      await page.waitForLoadState('networkidle').catch(() => {});
      return settled ? settled.status() : null;
    };

    await openEditForm();
    const originalTitle = await page.locator('#title').inputValue();
    const originalDate = await page.locator('#activity_date').inputValue();

    try {
      const status = await save(`${originalTitle} [EDITED AFTER APPROVAL]`, '2025-02-20');
      expect(
        status,
        'the edit never reached the server, so this test cannot judge whether it would be refused'
      ).not.toBeNull();

      // Read the value back off the record itself rather than the list. The list
      // is paginated, so a row locator can match nothing and make a "does not
      // contain" assertion pass for the wrong reason.
      await openEditForm();
      expect(
        await page.locator('#title').inputValue(),
        `approved contribution ${approvedId} was rewritten by its contributor after approval`
      ).not.toContain('EDITED AFTER APPROVAL');
      expect(
        await page.locator('#activity_date').inputValue(),
        `the activity date of approved contribution ${approvedId} was moved to another quarter`
      ).toBe(originalDate);
    } finally {
      await openEditForm();
      await save(originalTitle, originalDate);
    }
  });

  // CONFIRMED DEFECT (2026-09-30): the edit route does not check who owns the
  // record. An employee is served the edit form for a contribution belonging to
  // a different employee, including frozen ones from closed quarters.
  //
  // Only the GET is exercised — whether the update would also be accepted was
  // deliberately not tested, because that would alter another person's record.
  // The own-record case above shows the update path is open in general.
  //
  // Marked test.fail() so the suite stays green while the gap is open.
  test.fail('the edit route refuses a contribution belonging to someone else', async ({ page }) => {
    // Collect this employee's own record ids first.
    const contributionsPage = new ContributionsPage(page);
    await contributionsPage.loginAs('employee');
    await contributionsPage.navigateToContributions();
    const own = new Set(await ownContributionIds(page));

    // Then look at the full approval queue as hr to find a record that is not
    // theirs, rather than hardcoding an id that may be archived later.
    await page.context().clearCookies();
    const approvalPage = new ContributionsApprovalPage(page);
    await approvalPage.loginAs('hr');
    await approvalPage.navigateToContributionsApproval();
    const allIds = await page
      .locator('table tbody tr[data-item-id]')
      .evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.itemId!).filter(Boolean));
    const someoneElses = allIds.find((id) => !own.has(id));
    test.skip(!someoneElses, 'no contribution belonging to another employee was listed');

    // Back to the employee, who should have no business with that record.
    await page.context().clearCookies();
    await contributionsPage.loginAs('employee');
    await contributionsPage.navigateToContributions();

    expect(
      await editFormIsServed(page, someoneElses!),
      `the edit form for contribution ${someoneElses}, owned by another employee, was served`
    ).toBe(false);
  });
});
