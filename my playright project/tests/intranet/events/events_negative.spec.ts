import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import { login } from '../utils/login_helper';
import { stripClientValidation } from '../utils/test_helpers';

/**
 * Josh Events — negative cases.
 *
 * An event carries two date ranges that have to agree with each other and with
 * the calendar: the promotion window (when the event is advertised) and the
 * event window itself. Until now the module had only an RBAC spec, so none of
 * those rules — nor the create path at all — was covered.
 *
 * A refused submit redirects back to the form and reports its reasons in the
 * flash, so that is what these assert on. Note the POST response body itself is
 * empty (it is the redirect), which is why the flash has to be read from the
 * page that follows it. Flashes auto-dismiss, but these submits carry no file
 * upload and land well inside that window; the one case that does upload is the
 * last test, which asserts on the HTTP status instead.
 *
 * The banner uploads are omitted from the rule tests on purpose. The server
 * treats both banners as mandatory, so each response also carries "Promotion
 * banner can't be blank" — harmless, because each test asserts the one specific
 * message it is about. Attaching banners is not an option here: doing so returns
 * HTTP 500 (see the last test in this file).
 */
test.describe('Josh Events - negative cases', () => {

  const IMAGE = path.resolve(__dirname, '../../fixtures/image.png');

  interface EventTimes {
    promotionStart?: string;
    promotionEnd?: string;
    start?: string;
    end?: string;
    link?: string;
  }

  // Fills the New Event form, submits, and leaves the page on the response so
  // the caller can assert against the flash.
  async function submitEvent(page: Page, title: string, times: EventTimes): Promise<void> {
    await page.goto('/events/new');
    // Datetime inputs would otherwise let the browser refuse the submit, and a
    // submit the server never sees proves nothing about the server's rules.
    await stripClientValidation(page);

    await page.locator('#event_title').fill(title);
    await page.locator('#event_description').fill('Created by an automated test.');
    await page.locator('#event_promotion_start_time').fill(times.promotionStart ?? '2027-03-01T10:00');
    await page.locator('#event_promotion_end_time').fill(times.promotionEnd ?? '2027-03-10T10:00');
    await page.locator('#event_start_time').fill(times.start ?? '2027-03-15T10:00');
    await page.locator('#event_end_time').fill(times.end ?? '2027-03-15T18:00');
    await page.locator('#event_google_form_link').fill(times.link ?? 'https://example.com/form');

    await page.locator('#submit').click({ noWaitAfter: true });
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  const stamp = () => Date.now().toString().slice(-6);

  test('an empty event names every field the server requires', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/events/new');
    await stripClientValidation(page);
    await page.locator('#submit').click({ noWaitAfter: true });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Worth pinning: both banners are mandatory on the server even though
    // neither file input carries the required attribute, so the browser lets a
    // bannerless submit through and only the server objects.
    const flashes = page.locator('#flashes');
    for (const message of [
      "Title can't be blank",
      "Description can't be blank",
      "Promotion banner can't be blank",
      "Live banner can't be blank",
      "Google form link can't be blank",
    ]) {
      await expect(flashes, `the server did not report: ${message}`).toContainText(message);
    }
  });

  test('the promotion window cannot end before it starts', async ({ page }) => {
    await login(page, 'hr');
    await submitEvent(page, `Automated check ${stamp()}`, {
      promotionStart: '2027-03-10T10:00',
      promotionEnd: '2027-03-01T10:00',
    });
    await expect(page.locator('#flashes')).toContainText(
      /Promotion end time should always be greater than promotion start time/i
    );
  });

  test('the event cannot end before it starts', async ({ page }) => {
    await login(page, 'hr');
    await submitEvent(page, `Automated check ${stamp()}`, {
      start: '2027-03-20T18:00',
      end: '2027-03-20T10:00',
    });
    await expect(page.locator('#flashes')).toContainText(
      /End time should always be greater than start time/i
    );
  });

  test('an event cannot start in the past', async ({ page }) => {
    await login(page, 'hr');
    await submitEvent(page, `Automated check ${stamp()}`, {
      promotionStart: '2020-01-01T10:00',
      promotionEnd: '2020-01-05T10:00',
      start: '2020-01-10T10:00',
      end: '2020-01-10T18:00',
    });
    const flashes = page.locator('#flashes');
    await expect(flashes).toContainText(/Start time can't be in the past/i);
    await expect(flashes).toContainText(/Promotion start time can't be in the past/i);
  });

  // CONFIRMED DEFECT (2026-09-29): submitting the New Event form with its two
  // banner images returns HTTP 500 — Rails' generic "We're sorry, but something
  // went wrong" page — and no event is created. The values here are entirely
  // valid and nothing is tampered with; a bannerless submit gets a normal
  // validation response, so the crash arrives with the file uploads.
  //
  // Both banners are mandatory, so this is not a partial failure: no event can be
  // created through the form at all while this stands.
  //
  // Written as the control this file would otherwise need — it is the one test
  // that proves a valid event saves. Marked test.fail() so the suite stays green
  // while the gap is open; it will report "unexpectedly passed" once creation
  // works, at which point the rules blocked behind it (the Google form link
  // format, the promotion window against the event window, and non-image banner
  // uploads) become testable and should be added here.
  test.fail('a valid event with its banners is created', async ({ page }) => {
    await login(page, 'hr');
    const title = `Automated check ${stamp()}`;

    await page.goto('/events/new');
    await page.locator('#event_title').fill(title);
    await page.locator('#event_description').fill('Created by an automated test.');
    await page.locator('#event_promotion_start_time').fill('2027-03-01T10:00');
    await page.locator('#event_promotion_end_time').fill('2027-03-10T10:00');
    await page.locator('#event_start_time').fill('2027-03-15T10:00');
    await page.locator('#event_end_time').fill('2027-03-15T18:00');
    await page.locator('#event_google_form_link').fill('https://example.com/form');
    await page.locator('#promo-upload').setInputFiles(IMAGE);
    await page.locator('#live-upload').setInputFiles(IMAGE);

    const response = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().includes('/events'),
      { timeout: 60_000 }
    );
    await page.locator('#submit').click({ noWaitAfter: true });
    const status = (await response).status();

    expect(status, 'creating an event with its banners returned a server error').toBeLessThan(500);
  });
});
