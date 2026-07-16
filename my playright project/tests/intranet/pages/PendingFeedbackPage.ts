import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';

type UserKey = 'employee' | 'hr' | 'admin' | 'sales';

// Projects -> Pending Feedback -> an employee's performance feedback form.
export class PendingFeedbackPage {
  private readonly textareaNames = [
    'productivity',
    'communication_skills',
    'areas_for_improvement',
    'overall_assessment',
  ];

  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'hr') {
    await login(this.page, user);
  }

  async navigateToPendingFeedback() {
    await this.page.locator('a[href="/projects"]').first().click({ noWaitAfter: true });
    await this.page.waitForURL((url) => url.pathname === '/projects', { timeout: 30000 });
    await this.page.getByText('Pending Feedback', { exact: false }).first().click({ noWaitAfter: true });
    try {
      await this.page.waitForURL(/pending_feedback_list/, { timeout: 30000 });
    } catch {
      throw new Error('Failed to open the Pending Feedbacks list.');
    }
  }

  async search(name: string) {
    await this.page.getByRole('searchbox', { name: /search/i }).fill(name);
  }

  // Reads the feedback form URL from the readonly link input of the row matching
  // the given employee name (the table can be searched instead of scrolled).
  async getFeedbackLink(employeeName: string, project?: string): Promise<string> {
    await this.search(employeeName);
    let row = this.page.locator('table tbody tr').filter({ hasText: employeeName });
    if (project) row = row.filter({ hasText: project });
    const first = row.first();
    try {
      await expect(first).toBeVisible({ timeout: 20000 });
    } catch {
      const forProject = project ? ` (project "${project}")` : '';
      throw new Error(`No pending feedback row found for employee: "${employeeName}"${forProject}.`);
    }
    const link = await first.locator('input[readonly]').first().inputValue();
    if (!/performance_feedback_form/.test(link)) {
      throw new Error(`Feedback link not found for employee: "${employeeName}".`);
    }
    return link;
  }

  async openFeedbackFormFor(employeeName: string, project?: string) {
    const link = await this.getFeedbackLink(employeeName, project);
    await this.page.goto(link);
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // Opens the first available pending feedback (optionally narrowed by a search
  // term). Lets a test fill "whatever pending feedback exists" without hardcoding
  // an employee, so it stays re-runnable, and returns that employee's name.
  async openFirstPendingFeedback(searchTerm = ''): Promise<string> {
    if (searchTerm) {
      await this.search(searchTerm);
      await this.page.waitForTimeout(600);
    }
    const firstRow = this.page.locator('table tbody tr').first();
    try {
      await expect(firstRow).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('No pending feedback records found.');
    }
    const employee = (await firstRow.locator('td').nth(1).innerText().catch(() => '')).trim();
    const link = await firstRow.locator('input[readonly]').first().inputValue();
    if (!/performance_feedback_form/.test(link)) {
      throw new Error('First pending feedback row has no feedback link.');
    }
    await this.page.goto(link);
    await this.page.waitForLoadState('networkidle').catch(() => {});
    return employee;
  }

  // Selects a performance rating (any value) and fills every free-text field with
  // random text.
  async fillFeedbackForm() {
    const rating = this.page.locator('input[type="radio"][name="performance"]').first();
    try {
      await rating.check();
      await expect(rating).toBeChecked();
    } catch {
      throw new Error('Could not select a performance rating on the feedback form.');
    }

    const stamp = Date.now();
    for (const field of this.textareaNames) {
      const textarea = this.page.locator(`textarea[name="${field}"]`);
      await textarea.fill(`Automated ${field.replace(/_/g, ' ')} feedback ${stamp}`);
      await expect(textarea).not.toHaveValue('');
    }
  }

  async submit() {
    await this.page
      .locator('button:has-text("Save"), input[type="submit"][value="Save" i]')
      .first()
      .click();
  }

  async assertSubmitted() {
    const flash = this.page.locator('#flashes');
    try {
      await expect(flash).toContainText(/success|submitted|thank/i, { timeout: 15000 });
    } catch {
      throw new Error('Feedback submission was not confirmed (no success message).');
    }
  }
}
