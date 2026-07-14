import { Page, expect } from '@playwright/test';
import { login } from '../../utils/login_helper';
import { selectFromSingleSelect2, assertActivityDateWithinRange, setDateByEvaluate } from '../../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin';

export class LdRecordPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  // --- Navigation ---

  async navigateToCreateLdRecord() {
    await this.page.getByText('Activity and Benefits').click();
    await this.page.locator('span.fs-6.pl-4', { hasText: 'Create L&D record' }).click();
  }

  // --- L&D record form ---

  async selectLdCategory(optionValue: string) {
    await this.page.locator('#category').selectOption(optionValue);
  }

  async selectLdSubcategory(optionValue: string) {
    await this.page.locator('#subcategory').selectOption(optionValue);
  }

  async fillLdTitle(title: string) {
    await this.page.locator('#title').fill(title);
  }

  async fillLdDate(date: string) {
    await this.page.locator('#activity_date').fill(date);
  }

  // Validation — the Activity Date must fall within the allowed range that the
  // native date input enforces: not before the start of the current quarter
  // (`min`) and not in the future (`max` = today).
  async assertLdDateRange() {
    await assertActivityDateWithinRange(this.page);
  }

  // Forces a date value straight into the Activity Date input, bypassing the
  // native picker's `max`/`min` constraints. Used by negative tests to attempt
  // an out-of-range (e.g. future or previous-quarter) date that a user should
  // not be able to pick. stripConstraints removes min/max so the out-of-range
  // value also passes the browser's submit-time validation and the request
  // actually reaches the server (otherwise the form silently refuses to submit).
  async forceLdDate(value: string, fieldSelector = '#activity_date') {
    await setDateByEvaluate(this.page.locator(fieldSelector), value, { stripConstraints: true });
  }

  // Strict negative assertion — after submitting, the L&D record must NOT have
  // been saved. Judges the create POST that the form fires on submit:
  //   - No POST is sent  -> the client blocked submission (e.g. missing required
  //                         fields); nothing was created -> rejection (PASS).
  //   - POST returns 3xx -> a successful create redirect; a record WAS created
  //                         -> the server accepted invalid input -> FAIL.
  //   - POST returns 2xx/4xx -> the form re-rendered with errors -> rejection (PASS).
  // The form submits as a full-page navigation, so isNavigationRequest() reliably
  // isolates the create POST from Select2's background ajax (which is never a
  // navigation request). Call this INSTEAD of submitLdRecord() in tests that
  // expect the server to reject.
  async submitAndAssertRejected(context = 'invalid input') {
    const isCreatePost = (r: { method(): string; isNavigationRequest(): boolean }) => {
      try {
        return r.method() === 'POST' && r.isNavigationRequest();
      } catch {
        return false;
      }
    };

    const [request] = await Promise.all([
      this.page.waitForRequest(isCreatePost, { timeout: 8000 }).catch(() => null),
      this.submitLdRecord(),
    ]);

    // No create request left the browser — submission was blocked client-side, so
    // nothing could have been saved. That is the expected rejection.
    if (!request) return;

    const response = await request.response();
    const status = response ? response.status() : 0;
    const isRedirect = status >= 300 && status < 400; // 3xx = successful create
    expect(
      isRedirect,
      `Server accepted the L&D record (create POST returned ${status}) when it should have ` +
        `rejected it (${context}). A 3xx redirect means a record was created — the validation is missing.`
    ).toBe(false);
  }

  async selectLdEmployee(emailWithId: string) {
    await selectFromSingleSelect2(this.page, '#select2-employee-container', emailWithId);
  }

  async fillLdDuration(duration: string) {
    await this.page.locator('#duration').fill(duration);
  }

  async fillLdDescription(text: string) {
    await this.page.locator('#description').fill(text);
  }

  async pressEscape() {
    await this.page.keyboard.press('Escape');
  }

  async submitLdRecord() {
    await this.page.locator('button.btn.btn-secondary[type="submit"]').click();
  }

  // Reliable positive assertion — submits and confirms the record was saved by
  // judging the create POST's response. On success the controller responds with a
  // 3xx redirect (back to the new form); a 2xx re-render means the form came back
  // with validation errors, so nothing was saved.
  //
  // We judge the POST instead of the success flash because that flash is a
  // fixed-position, auto-dismissing toast (`int-alert`): by the time an assertion
  // polls the freshly-navigated page the toast is already gone, making a
  // visibility check racy. The redirect status is the trustworthy signal.
  async submitAndAssertSaved() {
    const isCreatePost = (r: { url(): string; method(): string }) => {
      try {
        return r.method() === 'POST' && new URL(r.url()).pathname.endsWith('/create_l_and_d_contribution');
      } catch {
        return false;
      }
    };

    const [request] = await Promise.all([
      this.page.waitForRequest(isCreatePost, { timeout: 8000 }),
      this.submitLdRecord(),
    ]);

    const response = await request.response();
    const status = response ? response.status() : 0;
    const isRedirect = status >= 300 && status < 400; // 3xx = saved
    expect(
      isRedirect,
      `Expected the L&D record to be saved (create POST should redirect, 3xx) but it returned ${status}. ` +
        `A non-redirect means the form re-rendered with validation errors — the record was not saved.`
    ).toBe(true);
  }
}
