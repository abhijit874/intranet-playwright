import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { searchProject } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader';

export class PoolReportPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.locator('span.fs-6.ms-2', { hasText: 'Pool Report' }).click();
    await expect(this.page).toHaveURL(/\/pool_reports/, { timeout: 20000 });
  }

  async navigateToFuturePool() {
    await this.page
      .locator('a.btn.btn-outline-secondary.btn-sm[href="/pool_reports/future_pool"]')
      .click();
    await expect(this.page).toHaveURL(/\/pool_reports\/future_pool/, { timeout: 20000 });
  }

  async searchEmployee(name: string, projectName?: string) {
    await searchProject(this.page, name);
    await this.page.waitForTimeout(1000);
    const noResults = this.page.locator('table tbody tr td', { hasText: /no (data|matching records)/i });
    const rowCount = await this.page.locator('table tbody tr').count();
    if (await noResults.count() > 0 || rowCount === 0) {
      const msg = projectName
        ? `No records found for employee "${name}" and project "${projectName}".`
        : `No records found for employee "${name}".`;
      throw new Error(msg);
    }
  }

  private findRow(employeeName: string, projectName: string) {
    return this.page
      .locator('table tbody tr')
      .filter({ hasText: employeeName })
      .filter({ hasText: projectName })
      .first();
  }

  async expectRowVisible(employeeName: string, projectName: string) {
    await expect(this.findRow(employeeName, projectName)).toBeVisible({ timeout: 20000 });
    return this.findRow(employeeName, projectName);
  }

  async clickAddToPool(employeeName: string, projectName: string) {
    const row = await this.expectRowVisible(employeeName, projectName);
    const icon = row.locator('i.text-success.ri-user-add-fill.fs-5');
    await expect(icon).toBeVisible({ timeout: 10000 });
    await icon.click();
  }

  async confirmAddToPool() {
    await this.page.locator('span.d-flex.align-items-center', { hasText: 'Yes, Add to Pool' }).click();
  }

  async assertAddedToPool() {
    const flash = this.page.locator('#flashes');
    await expect(flash).toBeVisible({ timeout: 20000 });
    await expect(flash).toContainText(/added.*pool/i);
  }

  async clickRemoveFromPool(employeeName: string, projectName: string) {
    const row = await this.expectRowVisible(employeeName, projectName);
    const icon = row.locator('i.text-danger.ri-user-minus-fill');
    await expect(icon).toBeVisible({ timeout: 10000 });
    await icon.click();
  }

  async confirmRemoveFromPool() {
    await this.page
      .locator('span.d-flex.align-items-center', { hasText: 'Yes, Remove from Pool' })
      .click();
  }

  async assertRemovedFromPool() {
    const flash = this.page.locator('#flashes');
    await expect(flash).toBeVisible({ timeout: 20000 });
    await expect(flash).toContainText(/removed.*pool/i);
  }

  async clickEditIcon(employeeName: string, projectName: string) {
    const row = await this.expectRowVisible(employeeName, projectName);
    await row.locator('i.text-dark.ri-edit-2-line').click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillOeta(date: string) {
    const field = this.page.locator('#pool_detail_oeta');
    await field.fill(date);
    await expect(field).toHaveValue(date);
  }

  async fillNeta(date: string) {
    const field = this.page.locator('#pool_detail_neta');
    await field.fill(date);
    await expect(field).toHaveValue(date);
  }

  async selectProposedProject(project: string) {
    await this.page
      .locator('.select2-selection--multiple:has(#select2-pool_detail_proposed_projects-container)')
      .scrollIntoViewIfNeeded();
    await this.page
      .locator('.select2-selection--multiple:has(#select2-pool_detail_proposed_projects-container)')
      .click();
    await this.page
      .locator('textarea[aria-controls="select2-pool_detail_proposed_projects-results"]')
      .fill(project);
    await this.page
      .locator('#select2-pool_detail_proposed_projects-results li', { hasText: project })
      .first()
      .click();
  }

  async fillTrainingPlan(text: string) {
    const field = this.page.locator('#pool_detail_training_plan');
    await field.fill(text);
    await expect(field).toHaveValue(text);
  }

  async fillInterviewRejected(text: string) {
    const field = this.page.locator('#pool_detail_interview_rejected');
    await field.fill(text);
    await expect(field).toHaveValue(text);
  }

  async fillComments(text: string) {
    const field = this.page.locator('#pool_detail_comments');
    await field.fill(text);
    await expect(field).toHaveValue(text);
  }

  async submitUpdate() {
    await this.page.locator('input[type="submit"][value="Update"]').click();
  }

  async assertPoolDetailsUpdated() {
    const flash = this.page.locator('#flashes');
    await expect(flash).toBeVisible({ timeout: 20000 });
    await expect(flash).toContainText(/updated/i);
  }

  async assertPoolReportLoaded() {
    await expect(this.page.locator('table tbody')).toBeVisible({ timeout: 20000 });
  }

  async clickEmployeeProfileLink(employeeName: string) {
    const nameCell = this.page
      .locator('table tbody tr td')
      .filter({ hasText: employeeName })
      .first();
    await expect(nameCell).toBeVisible({ timeout: 20000 });
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      nameCell.locator('a[href*="/users/"][href*="public_profile"]').click(),
    ]);
    await newPage.waitForLoadState('networkidle');
    this.page = newPage;
  }

  async assertProfilePageOpened(_employeeName: string) {
    await expect(this.page).toHaveURL(/\/users\/\d+\/public_profile/, { timeout: 20000 });
    await expect(this.page.locator('main, #main-content, .container, body > div').first()).toBeVisible({ timeout: 20000 });
  }

  async clickViewPastProjects(employeeName: string) {
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: employeeName })
      .first();
    await expect(row).toBeVisible({ timeout: 20000 });
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      row.locator('a[href*="public_profile#emp-details"]', { hasText: 'View Past Projects' }).click(),
    ]);
    await newPage.waitForLoadState('networkidle');
    this.page = newPage;
  }

  async assertPastProjectsPageOpened() {
    await expect(this.page).toHaveURL(/\/users\/\d+\/public_profile/, { timeout: 20000 });
  }
}
