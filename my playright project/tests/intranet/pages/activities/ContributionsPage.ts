import { expect, Locator, Page } from '@playwright/test';
import { login, UserKey } from '../../utils/login_helper';
import { assertActivityDateWithinRange, setDateByEvaluate } from '../../utils/test_helpers';

export class ContributionsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  // --- Navigation ---

  async navigateToContributions() {
    await this.page.getByText('Activity and Benefits').click();
    const menuContribution = this.page.locator('#contributionMenu').getByText('Contributions');
    if (await menuContribution.count()) {
      await menuContribution.first().click();
      return;
    }
    await this.page.getByRole('link', { name: /^Contributions$/i }).first().click();
  }

  // --- Redeem ---

  // The Contributions page shows two figures: "Earned benefits" (credited when
  // a record is approved) and "Available balance to redeem" — only the latter
  // can actually be redeemed, and the app moves earned benefits into it on its
  // own schedule, not immediately on approval. The Redeem link can render
  // enabled even at zero, so the amount itself must be read.
  // Call after navigateToContributions().
  async getRedeemableBalance(): Promise<number> {
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    const container = this.page.getByText(/Available balance to redeem/i).first();
    try {
      await expect(container).toBeVisible({ timeout: 10000 });
    } catch {
      return 0;
    }
    const text = (await container.textContent()) ?? '';
    const m = /Available balance to redeem\s*\(?₹?\)?\s*:?\s*([\d,]+)/i.exec(text);
    return m ? Number(m[1].replace(/,/g, '')) : 0;
  }

  // Whether the signed-in employee can actually redeem right now.
  async hasRedeemableBalance(): Promise<boolean> {
    const disabledRedeem = this.page.locator('a.btn.btn-secondary.disabled[title="No balance available"]');
    if (await disabledRedeem.count()) return false;
    if (!(await this.page.locator('#redeemBtn').count())) return false;
    return (await this.getRedeemableBalance()) > 0;
  }

  async clickRedeem() {
    const disabledRedeem = this.page.locator('a.btn.btn-secondary.disabled[title="No balance available"]');
    if (await disabledRedeem.count()) {
      throw new Error('No balance available to redeem');
    }
    await this.page.locator('#redeemBtn').click();
  }

  async confirmRedeem() {
    await this.page.locator('a[href="/redeems/new"]').click();
  }

  // --- Contribution form ---

  async clickAddContribution() {
    await this.page.waitForLoadState('networkidle');
    const addBtn = this.page.getByText(' Add Contribution');
    if (!(await addBtn.count())) {
      throw new Error("This user can't create contributions.");
    }
    await addBtn.click();
  }

  async selectCategory(category: string) {
    await this.page.locator('#select2-category-container').click();
    const option = this.page.locator('.select2-results__option', { hasText: category }).first();
    if (!(await option.count())) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
      throw new Error(`Category "${category}" not available for this user.`);
    }
    await option.click();
  }

  async selectSubcategory(subcategory: string) {
    const select = this.page.locator('#subcategory');
    const options = await select.locator('option').allTextContents();
    if (!options.some((o) => o.trim() === subcategory)) {
      throw new Error(`Subcategory "${subcategory}" not available.`);
    }
    await select.selectOption({ label: subcategory });
  }

  // The project dropdown lists only the projects the signed-in contributor is
  // allocated to, so pick whichever one they have rather than hardcoding a name.
  // Returns the chosen project's label.
  async selectFirstProject(): Promise<string> {
    const select = this.page.locator('#project_id');
    await expect(select).toBeVisible();
    const options = select.locator('option');
    const count = await options.count();
    for (let i = 0; i < count; i += 1) {
      const option = options.nth(i);
      const value = await option.getAttribute('value');
      const label = ((await option.textContent()) ?? '').trim();
      if (value && !/^\s*(--)?\s*select/i.test(label)) {
        await select.selectOption(value);
        return label;
      }
    }
    throw new Error('No project available for this contributor.');
  }

  async fillTitle(title: string) {
    await this.page.getByText('Title:').fill(title);
  }

  async fillDate(date: string) {
    await this.page.locator('#activity_date').fill(date);
  }

  // Validation — the Activity Date must fall within the allowed range that the
  // native date input enforces: not before the start of the current quarter
  // (`min`) and not in the future (`max` = today).
  async assertActivityDateRange() {
    await assertActivityDateWithinRange(this.page);
  }

  // Forces a date value straight into the Activity Date input, bypassing the
  // native picker's `max`/`min` constraints. Used by negative tests to attempt
  // an out-of-range (e.g. future) date that a user should not be able to pick.
  async forceActivityDate(value: string, fieldSelector = '#activity_date') {
    // stripConstraints removes min/max so the out-of-range value also passes the
    // browser's submit-time validation and the request actually reaches the
    // server (otherwise the form silently refuses to submit).
    await setDateByEvaluate(this.page.locator(fieldSelector), value, { stripConstraints: true });
  }

  // Strict negative assertion — after submitting, the contribution must NOT have
  // been saved. If the success flash appears, a record was created when it should
  // have been rejected, so this assertion fails (the bug is caught).
  // Reliable negative assertion: clicks Submit and judges the create POST.
  //   - No POST is sent  -> the client blocked submission (e.g. missing required
  //                         fields); nothing was created -> rejection (PASS).
  //   - POST returns 3xx -> a successful create redirect; a record WAS created
  //                         -> the server accepted invalid input -> FAIL.
  //   - POST returns 2xx/4xx -> the form re-rendered with errors -> rejection (PASS).
  // This is the only trustworthy signal: flashes/"stayed on form" can be missed
  // when the submit hangs, and searching the list is racy (a just-created record
  // may not be visible yet due to backend commit/visibility lag). Call this
  // INSTEAD of submitContribution() in tests that expect the server to reject.
  async submitAndAssertRejected(context = 'invalid input') {
    const isCreatePost = (r: { url(): string; method(): string }) => {
      try {
        return (
          new URL(r.url()).pathname.replace(/\/$/, '') === '/contributions' &&
          r.method() === 'POST'
        );
      } catch {
        return false;
      }
    };

    const [request] = await Promise.all([
      this.page.waitForRequest(isCreatePost, { timeout: 8000 }).catch(() => null),
      this.submitContribution(),
    ]);

    // No create request left the browser — submission was blocked client-side, so
    // nothing could have been saved. That is the expected rejection.
    if (!request) return;

    const response = await request.response();
    const status = response ? response.status() : 0;
    const isRedirect = status >= 300 && status < 400; // 3xx = successful create
    expect(
      isRedirect,
      `Server accepted the contribution (create POST returned ${status}) when it should have ` +
        `rejected it (${context}). A 3xx redirect means a record was created — the validation is missing.`
    ).toBe(false);
  }

  async fillFieldByLabel(label: string, value: string) {
    await this.page.getByText(label).fill(value);
  }

  async attachFile(fieldId: string, filePath: string) {
    await this.page.setInputFiles(fieldId, filePath);
  }

  async submitContribution() {
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  async assertSaved() {
    const alert = this.page.locator('#flashes');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Contribution saved successfully');
  }

  async assertUpdated() {
    const alert = this.page.locator('#flashes');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Contribution successfully updated');
  }

  async checkTeamMemberByName(name: string) {
    const label = this.page.locator('label', { hasText: name }).first();
    try {
      await expect(label).toBeVisible({ timeout: 10000 });
    } catch {
      throw new Error(`Team member checkbox not found for: "${name}".`);
    }
    const forAttr = await label.getAttribute('for');
    if (forAttr) {
      await this.page.locator(`#${forAttr}`).check();
    } else {
      await label.locator('input[type="checkbox"]').check();
    }
  }

  // --- Search & edit ---

  async searchContribution(text: string) {
    const candidates = [
      this.page.getByPlaceholder(/search/i).first(),
      this.page.locator('input[type="search"]').first(),
      this.page.locator('#contributions_table_filter input, #DataTables_Table_0_filter input').first(),
    ];
    for (const input of candidates) {
      if (await input.count()) {
        await input.fill(text);
        await input.press('Enter');
        return;
      }
    }
  }

  async openRowForEdit(title: string) {
    await this.searchContribution(title);
    const row = this.page.locator('table tbody tr', { hasText: title }).first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`Contribution row not found for: "${title}".`);
    }
    const selectors = [
      row.getByRole('button', { name: /edit/i }),
      row.getByRole('link', { name: /edit/i }),
      row.locator('a[title*="Edit" i], button[title*="Edit" i]').first(),
      row.locator('a:has(i.fa-edit), button:has(i.fa-edit), a:has(i[class*="edit"]), button:has(i[class*="edit"])').first(),
    ];
    for (const target of selectors) {
      if (await target.count()) {
        await target.click();
        return;
      }
    }
    throw new Error(`Edit action not found for row: ${title}`);
  }

  // Searches the contributions table for `title`, then deletes that exact row via
  // its delete icon (<i class="ri-delete-bin-line">). Deleting raises a native
  // confirm() popup that is NOT part of the DOM (it can't be located/inspected) —
  // a one-time dialog handler accepts it ("OK") so the deletion actually proceeds
  // (Playwright auto-dismisses dialogs unless a handler is registered first).
  async deleteContribution(title: string) {
    await this.searchContribution(title);
    const row = this.page.locator('table tbody tr', { hasText: title }).first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`Contribution row not found for: "${title}".`);
    }

    const deleteControl = row
      .locator('a:has(i.ri-delete-bin-line), button:has(i.ri-delete-bin-line), i.ri-delete-bin-line')
      .first();
    if (!(await deleteControl.count())) {
      throw new Error(`Delete action not found for row: "${title}".`);
    }

    // Register acceptance BEFORE the click that triggers the confirm() popup.
    this.page.once('dialog', (dialog) => dialog.accept());
    await deleteControl.scrollIntoViewIfNeeded();
    await deleteControl.click();

    // Let the delete request settle before the caller asserts the outcome.
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  // Confirms the contribution is gone: re-opens the list, searches for the exact
  // title, and expects no matching row to remain.
  async assertContributionDeleted(title: string) {
    await this.navigateToContributions();
    await this.searchContribution(title);
    const row = this.page.locator('table tbody tr', { hasText: title });
    await expect(row).toHaveCount(0);
  }

  async openFirstSearchResultForEdit() {
    const rows = this.page.locator('table tbody tr');
    const rowCount = await rows.count();
    if (!rowCount) throw new Error('No rows found after search.');

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const selectors = [
        row.locator('a[title*="Edit" i]:not(.disabled), button[title*="Edit" i]:not(.disabled)').first(),
        row.locator('a:has(i.fa-edit):not(.disabled), button:has(i.fa-edit):not(.disabled), a:has(i[class*="edit"]):not(.disabled)').first(),
        row.getByRole('button', { name: /edit/i }).first(),
        row.getByRole('link', { name: /edit/i }).first(),
      ];
      for (const target of selectors) {
        if (!(await target.count())) continue;
        const cls = (await target.getAttribute('class')) ?? '';
        const ariaDisabled = (await target.getAttribute('aria-disabled')) ?? '';
        const tooltip = ((await target.getAttribute('data-bs-original-title')) ?? '').toLowerCase();
        const title = ((await target.getAttribute('title')) ?? '').toLowerCase();
        const isDisabled =
          /\bdisabled\b/i.test(cls) ||
          ariaDisabled.toLowerCase() === 'true' ||
          tooltip.includes('edit disabled') ||
          title.includes('edit disabled');
        if (isDisabled) continue;
        await target.scrollIntoViewIfNeeded();
        await target.click({ timeout: 10000 });
        return true;
      }
    }
    throw new Error('No editable row found (all rows may be approved/locked).');
  }

  async openEditableFromSearchTerms(terms: string[], options: { throwOnMissing?: boolean } = {}) {
    const throwOnMissing = options.throwOnMissing ?? true;
    let lastError: unknown;
    for (const term of terms) {
      await this.searchContribution(term);
      try {
        await this.openFirstSearchResultForEdit();
        return true;
      } catch (error) {
        lastError = error;
      }
    }
    if (!throwOnMissing) return false;
    if (lastError instanceof Error) {
      throw new Error(`Could not find editable contribution for [${terms.join(', ')}]. ${lastError.message}`);
    }
    throw new Error(`Could not find editable contribution for [${terms.join(', ')}].`);
  }

  // Returns the row's Edit control only if it exists AND is not disabled
  // (approved/locked rows expose a disabled Edit). Returns null otherwise.
  private async findEditableEditTarget(row: Locator): Promise<Locator | null> {
    const selectors = [
      row.locator('a[title*="Edit" i]:not(.disabled), button[title*="Edit" i]:not(.disabled)').first(),
      row.locator('a:has(i.fa-edit):not(.disabled), button:has(i.fa-edit):not(.disabled), a:has(i[class*="edit"]):not(.disabled)').first(),
      row.getByRole('button', { name: /edit/i }).first(),
      row.getByRole('link', { name: /edit/i }).first(),
    ];
    for (const target of selectors) {
      if (!(await target.count())) continue;
      const cls = (await target.getAttribute('class')) ?? '';
      const ariaDisabled = (await target.getAttribute('aria-disabled')) ?? '';
      const tooltip = ((await target.getAttribute('data-bs-original-title')) ?? '').toLowerCase();
      const title = ((await target.getAttribute('title')) ?? '').toLowerCase();
      const isDisabled =
        /\bdisabled\b/i.test(cls) ||
        ariaDisabled.toLowerCase() === 'true' ||
        tooltip.includes('edit disabled') ||
        title.includes('edit disabled');
      if (isDisabled) continue;
      return target;
    }
    return null;
  }

  // Locates an existing contribution row by any combination of the visible table
  // columns (Title / Category / Subcategory / Activity Date), then opens it for
  // editing. Throws a clear error if nothing matches, or if every match is an
  // approved/locked (non-editable) row.
  async openContributionForEditByCriteria(criteria: {
    title?: string;
    category?: string;
    subcategory?: string;
    activityDate?: string;
  }) {
    const describe = () =>
      Object.entries(criteria)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}="${v}"`)
        .join(', ');

    // Drive the table's search box with the most specific available term so
    // client-side filtering narrows the rows before we match.
    const searchTerm =
      criteria.title ?? criteria.category ?? criteria.subcategory ?? criteria.activityDate;
    if (searchTerm) await this.searchContribution(searchTerm);

    // Narrow to rows containing every supplied value.
    let rows = this.page.locator('table tbody tr');
    for (const value of [criteria.title, criteria.category, criteria.subcategory, criteria.activityDate]) {
      if (value) rows = rows.filter({ hasText: value });
    }

    // DataTables renders a placeholder row when the filter matches nothing.
    const emptyState = this.page
      .locator('table tbody tr')
      .filter({ hasText: /No matching records found|No data available in table/i });

    // Wait until the table settles: either a matching row OR the empty-state
    // placeholder appears — so a genuine miss fails fast instead of waiting out
    // the full timeout.
    try {
      await expect(rows.or(emptyState).first()).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`No contribution row matches ${describe()}.`);
    }

    const count = await rows.count();
    if (count === 0) {
      throw new Error(`No contribution row matches ${describe()}.`);
    }
    for (let i = 0; i < count; i++) {
      const target = await this.findEditableEditTarget(rows.nth(i));
      if (target) {
        await target.scrollIntoViewIfNeeded();
        await target.click({ timeout: 10000 });
        return;
      }
    }
    throw new Error(
      `Found ${count} row(s) matching ${describe()}, but none are editable (they may be approved/locked).`
    );
  }

  async submitEdit() {
    await this.page.getByRole('button', { name: /update|submit|save/i }).click();
  }
}
