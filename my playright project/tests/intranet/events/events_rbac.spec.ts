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
 * Trello #1308 (FIXED, verified in-browser 2026-09-23) — the Events controller
 * previously had no authorization filter, so any role could reach /events/new by
 * URL and create an event the whole company then saw. It is now guarded: non-HR
 * roles have no Josh Events entry in the navigation, and a direct visit to
 * /events is refused with the standard authorization flash. These are ordinary
 * tests again — the test.fail() annotations that tracked the defect are gone.
 *
 * Admin keeps the Josh Events entry, as it does for every other module, so admin
 * is not in the non-owner list below.
 *
 * The marketing account (MARKETING_USER_EMAIL, designation "Senior Executive -
 * Marketing") carries plain-employee permissions and is treated as a non-owner.
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

  // --- admin: keeps access, as it does for every module -------------------

  test('admin: Josh Events is in the navigation and the list opens', async ({ page }) => {
    await login(page, 'admin');
    await expect(page.getByText('Josh Events')).toHaveCount(1);
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
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

  // Both the list and the create form are guarded, so a non-owner role is
  // bounced home with an authorization flash rather than merely losing the link.

  for (const role of nonOwnerRoles) {
    test(`${role}: a direct visit to /events is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/events');
    });

    test(`${role}: a direct visit to /events/new is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/events/new');
    });
  }

  test('employee: the New Event form does not render', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/events/new');
    await expect(page.locator('#event_title')).toHaveCount(0);
  });

  test('marketing: the New Event form does not render', async ({ page }) => {
    await login(page, 'marketing');
    await page.goto('/events/new');
    await expect(page.locator('#event_title')).toHaveCount(0);
  });

  test('employee: the Add Event control is not offered on the list', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/events');
    await expect(page.getByText('Add Event')).toHaveCount(0);
  });
});
