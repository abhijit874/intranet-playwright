import { test, expect, Page } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Who may add feedback on another employee's profile.
 *
 * Feedback is entered from the Feedbacks tab of an employee's public profile via
 * an "Add Feedback Detail" control that reveals the inline new-feedback form
 * (POST /interview_tracks). The access model (confirmed with the user, verified
 * in-browser 2026-10-08):
 *   - add + view:  hr, admin, leader   (leader is the role the `sales` account holds)
 *   - view only:   manager, ld   — the Feedbacks tab opens, but no Add Feedback
 *                  Detail control is offered
 *   - no feedback: finance can open the profile but is not given a Feedbacks tab
 *                  at all, so it can neither view nor add feedback
 *   - no access:   a plain employee cannot open another employee's profile at all;
 *                  the page redirects home with the authorization flash
 *
 * These tests only read the page and, for the add-capable roles, open the form
 * without submitting — nothing is written to any real employee's record.
 *
 * The target profile is discovered once (the first employee in HR's list) rather
 * than hardcoded, so the spec survives that particular employee being removed.
 */

const ADD_ROLES: UserKey[] = ['hr', 'admin', 'leader'];
const VIEW_ONLY_ROLES: UserKey[] = ['manager', 'ld'];

let targetProfile = ''; // e.g. /users/822/public_profile

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await login(page, 'hr');
    const list = new EmployeeListPage(page);
    await list.navigateToEmployees();
    await list.switchToCompactView();
    const href = await page
      .locator('#user_table > tbody > tr > td:nth-child(7) > a')
      .first()
      .getAttribute('href');
    if (!href) throw new Error('could not find an employee profile link to target');
    targetProfile = new URL(href, 'https://x').pathname;
  } finally {
    await context.close();
  }
});

// The actionable Add Feedback Detail control (a link/button), not any stray text.
function addFeedbackControl(page: Page) {
  return page.locator('a, button').filter({ hasText: 'Add Feedback Detail' });
}

async function openFeedbacksTab(page: Page) {
  await page.goto(targetProfile);
  await page.waitForLoadState('networkidle').catch(() => {});
  await new EmployeeProfilePage(page).clickProfileTab('Feedbacks');
}

test.describe('Employee feedback - add access per role', () => {

  for (const role of ADD_ROLES) {
    test(`${role}: can open the Add Feedback form`, async ({ page }) => {
      await login(page, role);
      await openFeedbacksTab(page);

      const control = addFeedbackControl(page);
      await expect(
        control,
        `${role} should be able to add feedback but the Add Feedback Detail control is missing`
      ).toBeVisible();

      // Opening the form proves the control is real and the role is permitted;
      // nothing is submitted, so no feedback record is created.
      await control.first().click();
      await expect(page.locator('#new_interview_track')).toBeVisible();
    });
  }

  for (const role of VIEW_ONLY_ROLES) {
    test(`${role}: can view the Feedbacks tab but cannot add`, async ({ page }) => {
      await login(page, role);
      await openFeedbacksTab(page);

      // View access is intact — the tab opened above without error.
      await expect(
        addFeedbackControl(page),
        `${role} is view-only but is offered the Add Feedback Detail control`
      ).toHaveCount(0);
    });
  }

  test('finance: the profile opens but offers no Feedbacks tab', async ({ page }) => {
    await login(page, 'finance');
    await page.goto(targetProfile);
    await page.waitForLoadState('networkidle').catch(() => {});

    // Finance reaches the profile (unlike a plain employee) but feedback is not
    // exposed to it at all — there is no Feedbacks tab to open.
    await expect(page.getByRole('tab', { name: 'Public Profile', exact: true })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Feedbacks', exact: true }),
      'finance is not expected to see feedback, but a Feedbacks tab is present'
    ).toHaveCount(0);
  });

  test('employee: cannot open another employee profile at all', async ({ page }) => {
    await login(page, 'employee');
    await expectAccessDenied(page, targetProfile);
  });
});
