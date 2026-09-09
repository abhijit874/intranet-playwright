import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Events access control.
 *
 * Events ("Josh Events") is an HR-owned module. HR gets the navigation entry
 * and can add, edit and delete events. No other role should be able to create
 * or edit one, including the marketing designation.
 *
 * Trello #1308 — the Events controller has no authorization filter, so every
 * role can reach /events/new by URL and create an event the whole company then
 * sees. The tests asserting that non-HR roles are refused are marked
 * test.fail(): they are the correct expectation and pass by failing until the
 * guard is added. Once it lands, Playwright reports them as "unexpectedly
 * passed", which is the signal to drop the annotation.
 *
 * Note on the marketing account (MARKETING_USER_EMAIL): its designation is
 * "Senior Executive - Marketing", but on staging it carries plain-employee
 * permissions — no Josh Events entry in its navigation, and it is refused on
 * /resource_list and /invite_user with the employee authorization flash. It can
 * currently reach the New Event form, but only because of #1308, not because
 * the designation grants anything. It is treated as a non-owner role here.
 */
test.describe('Events - access per role', () => {

  // --- hr: the owning role ------------------------------------------------

  test('hr: Josh Events is in the navigation and the list opens', async ({ page }) => {
    await login(page, 'hr');
    await expect(page.getByText('Josh Events')).toHaveCount(1);
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
    await expect(page.getByText('Add Event')).toBeVisible();
  });

  test('hr: the list exposes the Upcoming, Live and Completed tabs', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/events');
    // Bootstrap tabs here are plain anchors with data-bs-toggle, not role="tab".
    for (const tab of ['Upcoming', 'Live', 'Completed']) {
      await expect(page.locator('.nav-tabs .nav-link', { hasText: tab })).toBeVisible();
    }
  });

  test('hr: the New Event form opens with its required fields', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/events/new');
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    // toBeAttached rather than toBeVisible: the datetime-local and file inputs
    // are styled/wrapped and their computed visibility is timing-sensitive on a
    // loaded staging box. Presence in the rendered form is the thing under test.
    for (const field of [
      '#event_title',
      '#event_description',
      '#event_promotion_start_time',
      '#event_promotion_end_time',
      '#event_start_time',
      '#event_end_time',
      '#event_google_form_link',
      '#promo-upload',
      '#live-upload',
    ]) {
      await expect(page.locator(field), `${field} should be on the New Event form`).toBeAttached();
    }
    // The datetime and url fields the form marks mandatory.
    await expect(page.locator('#event_promotion_start_time')).toHaveJSProperty('required', true);
    await expect(page.locator('#event_google_form_link')).toHaveJSProperty('required', true);
  });

  test('hr: completed events are read-only - the Completed table has no Action column', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/events');
    // Assert against the thead as a whole: DataTables can clone the header row,
    // which makes per-th array matching count-sensitive and flaky under load.
    const thead = page.locator('#Completed-table thead');
    for (const column of ['Title', 'Description', 'Promotion Timings', 'Timings', 'Promotion Banner', 'Live Banner']) {
      await expect(thead).toContainText(column);
    }
    await expect(thead).not.toContainText('Action');
  });

  test('hr: an editable event exposes both edit and delete actions', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/events');
    const editLinks = page.locator('a[href*="/events/"][href$="/edit"]');
    const editCount = await editLinks.count();
    // Only upcoming and live events carry actions; completed ones do not. Skip
    // rather than fail when staging happens to hold no editable event.
    test.skip(editCount === 0, 'no upcoming or live event on staging to act on');
    expect(await page.locator('svg[data-icon="trash-can"]').count()).toBe(editCount);
  });

  // --- every other role, marketing included ------------------------------

  const nonOwnerRoles: UserKey[] = [
    'employee', 'manager', 'finance', 'sales', 'leader', 'ld', 'marketing',
  ];

  for (const role of nonOwnerRoles) {
    test(`${role}: Josh Events is absent from the navigation`, async ({ page }) => {
      await login(page, role);
      await expect(page.getByText('Josh Events')).toHaveCount(0);
    });
  }

  // --- Trello #1308 -------------------------------------------------------
  // Currently failing: the controller admits every role.

  for (const role of nonOwnerRoles) {
    test.fail(`${role}: a direct visit to /events is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/events');
    });

    test.fail(`${role}: a direct visit to /events/new is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/events/new');
    });
  }

  test.fail('employee: the New Event form does not render', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/events/new');
    await expect(page.locator('#event_title')).toHaveCount(0);
  });

  test.fail('marketing: the New Event form does not render', async ({ page }) => {
    await login(page, 'marketing');
    await page.goto('/events/new');
    await expect(page.locator('#event_title')).toHaveCount(0);
  });

  test.fail('employee: the Add Event control is not offered on the list', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/events');
    await expect(page.getByText('Add Event')).toHaveCount(0);
  });
});
