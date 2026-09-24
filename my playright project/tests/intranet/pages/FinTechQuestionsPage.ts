import { expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { login } from '../utils/login_helper';
import { expectFlashMessage } from '../utils/test_helpers';

// FinTech Questions is restricted: only the L&D account and admin can reach it.
// Every other role is bounced to "/" with an authorization flash, so the RBAC
// spec needs the wider set.
export type FinTechUserKey =
  | 'ld'
  | 'admin'
  | 'employee'
  | 'hr'
  | 'leader'
  | 'sales'
  | 'finance'
  | 'manager';

export const COE_OPTIONS = [
  'Trading',
  'Payment',
  'Core Banking',
  'Investment & Wealth Management',
  'Lending',
] as const;

export const LEVEL_OPTIONS = ['Easy', 'Medium', 'Hard'] as const;

export const NOT_AUTHORIZED_MESSAGE = 'You are not authorized to access FinTech Questions.';

export class FinTechQuestionsPage {
  constructor(private page: Page) {}

  async loginAs(user: FinTechUserKey = 'ld') {
    await login(this.page, user);
  }

  // --- Navigation ---

  navLink() {
    return this.page.locator('a[href="/fintech_questions"]');
  }

  async navigateTo() {
    await this.navLink().first().click();
    try {
      await expect(this.page).toHaveURL(/\/fintech_questions/i);
    } catch {
      throw new Error('Failed to navigate to FinTech Questions page.');
    }
    await this.assertListLoaded();
  }

  // Direct hit on the URL — used by the RBAC spec, which must reach the route
  // without a nav link to click.
  async openListDirectly() {
    await this.page.goto('/fintech_questions');
  }

  async openAddQuestion() {
    await this.page.getByRole('link', { name: 'Add Question' }).click();
    try {
      await expect(this.page).toHaveURL(/\/fintech_questions\/new/i);
    } catch {
      throw new Error('Failed to navigate to the Add Question form.');
    }
  }

  async openAnalytics() {
    await this.page.getByRole('link', { name: 'Analytics & Reports' }).click();
    try {
      await expect(this.page).toHaveURL(/\/fintech_questions\/analytics/i);
    } catch {
      throw new Error('Failed to navigate to FinTech Analytics & Reports.');
    }
  }

  async openBulkUpload() {
    await this.page.getByRole('link', { name: 'Bulk CSV Upload' }).click();
    try {
      await expect(this.page).toHaveURL(/\/fintech_questions\/import/i);
    } catch {
      throw new Error('Failed to navigate to the Bulk CSV Upload page.');
    }
  }

  // --- List page ---

  table() {
    return this.page.locator('#fintech_questions_table');
  }

  // Rows excluding the "No questions found." placeholder the table renders when
  // a filter matches nothing.
  rows() {
    return this.table().locator('tbody tr').filter({ has: this.page.locator('td a[href$="/edit"]') });
  }

  async assertListLoaded() {
    try {
      await expect(this.page.getByRole('heading', { name: 'FinTech Questions' })).toBeVisible();
      await expect(this.table()).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('FinTech Questions list did not load.');
    }
  }

  async assertColumnHeaders() {
    const expected = [
      '#', 'CoE', 'Level', 'Question',
      'Option A', 'Option B', 'Option C', 'Option D',
      'Correct', 'Action',
    ];
    const actual = (await this.table().locator('thead th').allInnerTexts())
      .map((t) => t.replace(/\s+/g, ' ').trim());
    expect(actual).toEqual(expected);
  }

  // Values of one column across every visible row. 1-based to match nth-child.
  async columnValues(index: number): Promise<string[]> {
    return this.rows().evaluateAll(
      (trs, i) => trs.map((tr) => (tr.querySelectorAll('td')[i - 1]?.textContent || '').replace(/\s+/g, ' ').trim()),
      index
    );
  }

  // The filters submit the form on change, so every setter waits for the
  // resulting page load rather than assuming the table updated in place.
  async filterByCoE(coe: string) {
    await Promise.all([
      this.page.waitForURL(/coe=/, { timeout: 20000 }),
      this.page.locator('#coe').selectOption(coe),
    ]);
    await this.assertListLoaded();
  }

  async filterByLevel(level: string) {
    await Promise.all([
      this.page.waitForURL(/level=/, { timeout: 20000 }),
      this.page.locator('#level').selectOption(level),
    ]);
    await this.assertListLoaded();
  }

  async search(term: string) {
    await Promise.all([
      this.page.waitForURL(new RegExp(`search=${encodeURIComponent(term)}`), { timeout: 20000 }),
      this.page.locator('#fintech_search_input').fill(term),
    ]);
    await this.assertListLoaded();
  }

  async clearFilters() {
    await this.page.getByRole('link', { name: 'Clear' }).click();
    await this.assertListLoaded();
  }

  // "Show All" reveals inactive questions too; the same control then reads
  // "Show Active" to go back.
  async showAll() {
    await this.page.getByRole('link', { name: 'Show All' }).click();
    await expect(this.page).toHaveURL(/show_inactive=true/i);
    await this.assertListLoaded();
  }

  // The "Show Active" link drops back to the bare list URL rather than spelling
  // out show_inactive=false, so the assertion is that the flag is gone.
  async showActiveOnly() {
    await this.page.getByRole('link', { name: 'Show Active' }).click();
    await expect(this.page).not.toHaveURL(/show_inactive=true/i);
    await this.assertListLoaded();
    await expect(this.page.getByRole('link', { name: 'Show All' })).toBeVisible();
  }

  // Questions created by tests are inactive, so they are only listed once
  // "show all" is on. Searching by the run's unique suffix isolates them.
  async findQuestionRow(term: string) {
    await this.page.goto(`/fintech_questions?show_inactive=true&search=${encodeURIComponent(term)}`);
    await this.assertListLoaded();
    const row = this.rows().first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`No FinTech question row found for: "${term}".`);
    }
    return row;
  }

  async openEditForQuestion(term: string) {
    const row = await this.findQuestionRow(term);
    await row.locator('a[href$="/edit"]').click();
    try {
      await expect(this.page).toHaveURL(/\/fintech_questions\/\d+\/edit/i);
    } catch {
      throw new Error(`Failed to open the edit form for question: "${term}".`);
    }
  }

  // --- Question form (shared by new + edit) ---

  async selectCoE(coe: string) {
    await this.page.locator('#fintech_question_coe').selectOption(coe);
    await expect(this.page.locator('#fintech_question_coe')).toHaveValue(coe);
  }

  async selectLevel(level: string) {
    await this.page.locator('#fintech_question_level').selectOption(level);
    await expect(this.page.locator('#fintech_question_level')).toHaveValue(level);
  }

  async fillQuestion(text: string) {
    await this.page.locator('#fintech_question_question').fill(text);
  }

  async fillOptions(a: string, b: string, c?: string, d?: string) {
    await this.page.locator('#fintech_question_option_a').fill(a);
    await this.page.locator('#fintech_question_option_b').fill(b);
    if (c !== undefined) await this.page.locator('#fintech_question_option_c').fill(c);
    if (d !== undefined) await this.page.locator('#fintech_question_option_d').fill(d);
  }

  async selectCorrectOption(letter: 'A' | 'B' | 'C' | 'D') {
    await this.page.locator('#fintech_question_correct_option').selectOption(letter);
    await expect(this.page.locator('#fintech_question_correct_option')).toHaveValue(letter);
  }

  async fillExplanation(text: string) {
    await this.page.locator('#fintech_question_explanation').fill(text);
  }

  // The form ships with Active pre-checked. Tests deliberately turn it off so a
  // throwaway question is never handed to a real employee's daily assignment.
  async setActive(active: boolean) {
    const box = this.page.locator('#fintech_question_active');
    if (active) await box.check();
    else await box.uncheck();
    await expect(box).toBeChecked({ checked: active });
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Save Question' }).click();
  }

  async assertCreated() {
    await expectFlashMessage(this.page, 'FinTech Question was successfully created.', 'creating a FinTech question');
    await expect(this.page).toHaveURL(/\/fintech_questions/i);
  }

  async assertUpdated() {
    await expectFlashMessage(this.page, 'FinTech Question was successfully updated.', 'updating a FinTech question');
    await expect(this.page).toHaveURL(/\/fintech_questions/i);
  }

  async assertDeleted() {
    await expectFlashMessage(this.page, 'Question was successfully deleted.', 'deleting a FinTech question');
  }

  // A rejected submit keeps the browser on the form instead of returning to the
  // list — that is what proves the record was not created. No flash container is
  // rendered at all in that case, so the success text is checked against the page.
  async assertNotCreated() {
    await expect(this.page).toHaveURL(/\/fintech_questions\/new/i);
    await expect(this.page.locator('body')).not.toContainText('successfully created');
  }

  // Fields the browser itself refuses to submit while empty.
  async invalidFieldIds(): Promise<string[]> {
    return this.page.$$eval('form.needs-validation :invalid', (els) =>
      els.map((e) => (e as HTMLElement).id).filter(Boolean)
    );
  }

  // --- Delete ---

  // The Delete Question link is a Turbo `data-turbo-confirm` link, which raises a
  // native confirm dialog. Accept it before clicking or the click hangs.
  async deleteCurrentQuestion() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.getByRole('link', { name: 'Delete Question' }).click();
    await this.assertDeleted();
  }

  async assertQuestionAbsent(term: string) {
    await this.page.goto(`/fintech_questions?show_inactive=true&search=${encodeURIComponent(term)}`);
    await this.assertListLoaded();
    await expect(this.rows()).toHaveCount(0);
    await expect(this.table().locator('tbody')).toContainText('No questions found');
  }

  // --- Analytics ---

  async assertAnalyticsLoaded() {
    try {
      await expect(this.page.getByRole('heading', { name: 'FinTech Analytics & Reports' })).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('FinTech Analytics & Reports page did not load.');
    }
  }

  // The analytics filters submit themselves: each control reloads the page with
  // its value in the query string. There is no "Apply Filters" button any more,
  // so each filter is set and then awaited on the resulting navigation.
  //
  // Setting a filter to the value it already holds fires no change event and so
  // triggers no navigation — the end-date field defaults to today, for one — which
  // is why the current query string is checked first rather than always waiting.
  private async setAnalyticsFilter(param: string, value: string, set: () => Promise<unknown>) {
    const current = new URL(this.page.url()).searchParams.get(param);
    if (current === value) {
      await set();
      return;
    }
    await Promise.all([
      this.page.waitForURL((url) => url.searchParams.get(param) === value, { timeout: 20000 }),
      set(),
    ]);
  }

  async applyAnalyticsFilters(opts: { startDate?: string; endDate?: string; coe?: string; search?: string }) {
    if (opts.startDate) {
      await this.setAnalyticsFilter('start_date', opts.startDate, () =>
        this.page.locator('#start_date').fill(opts.startDate!));
    }
    if (opts.endDate) {
      await this.setAnalyticsFilter('end_date', opts.endDate, () =>
        this.page.locator('#end_date').fill(opts.endDate!));
    }
    if (opts.coe) {
      await this.setAnalyticsFilter('coe', opts.coe, () =>
        this.page.locator('#coe').selectOption(opts.coe!));
    }
    if (opts.search) {
      await this.setAnalyticsFilter('search', opts.search, () =>
        this.page.locator('#search').fill(opts.search!));
    }
    await this.assertAnalyticsLoaded();
  }

  leaderboardTable() {
    return this.page.locator('table').filter({ hasText: 'Employee Name' }).first();
  }

  participationTable() {
    return this.page.locator('table').filter({ hasText: 'Participation Rate' }).first();
  }

  // --- Bulk CSV upload ---

  async assertImportPageLoaded() {
    try {
      await expect(this.page.getByRole('heading', { name: /Bulk CSV Upload/i })).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Bulk CSV Upload page did not load.');
    }
  }

  // Clicks the template link and saves the file the browser actually receives,
  // rather than re-fetching the URL — that is what proves the download works for
  // a real user.
  async downloadTemplateCsv(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: 'Download Template CSV' }).click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }

  async uploadQuestionsCsv(filePath: string) {
    await this.page.locator('#file').setInputFiles(filePath);
    await this.page.getByRole('button', { name: 'Upload & Import Questions' }).click();
  }

  async assertImportSucceeded(rowCount: number) {
    await expectFlashMessage(
      this.page,
      `Import completed! All ${rowCount} questions imported successfully.`,
      'a bulk CSV import'
    );
    await expect(this.page).toHaveURL(/\/fintech_questions(\?|$)/i);
  }

  // A rejected row keeps the browser on the import page and renders a per-row
  // breakdown instead of importing anything.
  async assertImportReportedErrors(failed: number, total: number) {
    await expect(this.page).toHaveURL(/\/fintech_questions\/import/i);
    await expect(this.page.locator('#flashes')).toContainText(
      `${total - failed} out of ${total} questions uploaded successfully, ${failed} failed.`
    );
    await expect(this.page.getByText('Detailed Import Error Report')).toBeVisible();
  }

  importErrorTable() {
    return this.page.locator('table').filter({ hasText: 'Error Reason' }).first();
  }

  // Deletes every question matching `term`, one at a time — a bulk import can
  // create several rows, and each needs its own confirm-and-delete pass.
  async deleteAllQuestionsMatching(term: string, maxRows = 20) {
    for (let i = 0; i < maxRows; i++) {
      await this.page.goto(`/fintech_questions?show_inactive=true&search=${encodeURIComponent(term)}`);
      await this.assertListLoaded();
      if ((await this.rows().count()) === 0) return;
      const href = await this.rows().first().locator('a[href$="/edit"]').getAttribute('href');
      await this.page.goto(href!);
      await this.deleteCurrentQuestion();
    }
    throw new Error(`More than ${maxRows} questions still match "${term}" after cleanup.`);
  }
}
