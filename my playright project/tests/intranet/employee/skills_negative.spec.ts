import { test, expect } from '@playwright/test';
import { login } from '../utils/login_helper';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

/**
 * Skills — negative cases.
 *
 * An employee edits their own skills from the Skills tab of their profile (PUT
 * /users/{id}/public_profile), choosing a primary and an optional secondary
 * skill. The positive spec only ever picks two valid skills, so neither the
 * "primary is required" rule nor the ownership boundary is exercised.
 *
 * Both are enforced server-side (verified 2026-10-08) — notably the ownership
 * check, which the contributions edit route lacks (Trello #1330). These tests
 * pin that down so a regression would surface.
 *
 * Every submit here uses a BLANK primary skill, which the server rejects, so
 * nothing is ever persisted to any profile — including the cross-user case,
 * where a blank value could not take effect even if the guard were missing.
 */

// A different employee's id, discovered once so the cross-user test targets a
// real profile that is not the signed-in employee's own.
let otherUserId = '';

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
    otherUserId = href?.match(/users\/(\d+)/)?.[1] ?? '';
    if (!otherUserId) throw new Error('could not discover another employee id');
  } finally {
    await context.close();
  }
});

test.describe('Skills - negative cases', () => {

  test('updating own skills requires a primary skill', async ({ page }) => {
    const profile = new EmployeeProfilePage(page);
    await profile.loginAs('employee');
    await profile.navigateToProfile();
    await profile.clickProfileTab('Skills');

    // Clear the primary skill and save. The profile keeps whatever skill it had,
    // since the server refuses the blank value rather than storing it.
    await page.locator('#public_profile_technical_skills_1').selectOption('');
    const response = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().includes('public_profile'),
      { timeout: 30_000 }
    );
    await page.getByRole('button', { name: 'Update Skills' }).click();
    const status = (await response).status();

    // A successful update redirects (3xx); a rejected one re-renders the form with
    // a 4xx and the error. Anything in the 2xx/4xx range here means "not saved".
    expect(status, 'a blank primary skill was accepted').toBeGreaterThanOrEqual(400);
    await expect(page.locator('#flashes')).toContainText(/primary technical skills can't be blank/i);
  });

  // The ownership boundary the contributions edit route is missing (#1330): one
  // employee must not be able to write to another employee's profile. Done as a
  // direct PUT because the UI gives a plain employee no way to even open another
  // profile — which is the exact path an ownership check has to cover.
  test('an employee cannot update another employee\'s skills', async ({ page }) => {
    const profile = new EmployeeProfilePage(page);
    await profile.loginAs('employee');
    await profile.navigateToProfile();
    await profile.clickProfileTab('Skills');

    const ownId = new URL(page.url()).pathname.match(/users\/(\d+)/)?.[1] ?? '';
    test.skip(!otherUserId || otherUserId === ownId, 'no distinct other employee id available');

    const token = await page.locator('meta[name="csrf-token"]').getAttribute('content');
    const response = await page.request.post(`/users/${otherUserId}/public_profile`, {
      headers: { 'X-CSRF-Token': token ?? '' },
      form: {
        _method: 'put',
        authenticity_token: token ?? '',
        // Blank primary skill: invalid, so this cannot persist even if the
        // ownership check were absent. We are testing authorization, not content.
        'public_profile[technical_skills_1]': '',
        'public_profile[technical_skills_2]': '',
      },
      maxRedirects: 0,
    });

    // A guarded route bounces the cross-user write home (302 to "/"). If instead
    // it reached validation (422), the server would be acting on another user's
    // record without an ownership check — the defect this test guards against.
    const status = response.status();
    const location = response.headers()['location'] ?? '';
    expect(
      status === 302 && /\/$/.test(location),
      `expected a redirect home for a cross-user update, got status ${status} (location "${location}")`
    ).toBe(true);
  });
});
