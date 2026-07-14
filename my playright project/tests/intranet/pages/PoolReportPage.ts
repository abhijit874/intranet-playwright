import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { searchProject, filterTableBySearch } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader' | 'sales';

export class PoolReportPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.locator('span.fs-6.ms-2', { hasText: 'Pool Report' }).click();
    try {
      await expect(this.page).toHaveURL(/\/pool_reports/, { timeout: 20000 });
    } catch {
      throw new Error('Failed to navigate to Pool Reports page.');
    }
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
    await filterTableBySearch(this.page, employeeName);
    try {
      await expect(this.findRow(employeeName, projectName)).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`Row not found for employee "${employeeName}" and project "${projectName}".`);
    }
    return this.findRow(employeeName, projectName);
  }

  async clickRemoveFromPool(employeeName: string, projectName: string) {
    const row = await this.expectRowVisible(employeeName, projectName);
    const icon = row.locator('i.text-danger.ri-user-minus-fill');
    try {
      await expect(icon).toBeVisible({ timeout: 10000 });
    } catch {
      throw new Error(
        `Remove from pool button not found for employee "${employeeName}" and project "${projectName}".`
      );
    }
    await icon.click();
  }

  async confirmRemoveFromPool() {
    await this.page
      .locator('span.d-flex.align-items-center', { hasText: 'Yes, Remove from Pool' })
      .click();
  }

  async assertRemovedFromPool() {
    const alert = this.page.locator('#flashes');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveClass(/alert-success/);
    await expect(alert).toContainText('Successfully removed');
    await expect(alert).toContainText('from the pool.');
  }

  async clickEditIcon(employeeName: string, projectName: string) {
    const row = await this.expectRowVisible(employeeName, projectName);
    await row.locator('i.text-dark.ri-edit-2-line').click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillOeta(date: string) {
    const field = this.page.locator('#pool_detail_oeta');
    await field.fill(date);
    try {
      await expect(field).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill OETA field with value: "${date}".`);
    }
  }

  async fillNeta(date: string) {
    const field = this.page.locator('#pool_detail_neta');
    await field.fill(date);
    try {
      await expect(field).toHaveValue(date);
    } catch {
      throw new Error(`Failed to fill NETA field with value: "${date}".`);
    }
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
    try {
      await expect(field).toHaveValue(text);
    } catch {
      throw new Error(`Failed to fill training plan field with value: "${text}".`);
    }
  }

  async fillInterviewRejected(text: string) {
    const field = this.page.locator('#pool_detail_interview_rejected');
    await field.fill(text);
    try {
      await expect(field).toHaveValue(text);
    } catch {
      throw new Error(`Failed to fill interview rejected field with value: "${text}".`);
    }
  }

  async fillComments(text: string) {
    const field = this.page.locator('#pool_detail_comments');
    await field.fill(text);
    try {
      await expect(field).toHaveValue(text);
    } catch {
      throw new Error(`Failed to fill comments field with value: "${text}".`);
    }
  }

  async submitUpdate() {
    await this.page.locator('input[type="submit"][value="Update"]').click();
  }

  async assertPoolDetailsUpdated() {
    const alert = this.page.locator('#flashes');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveClass(/alert-success/);
    await expect(alert).toContainText('Data updated successfully for');
  }

  async assertPoolReportLoaded() {
    try {
      await expect(this.page.locator('table tbody')).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Pool report table did not load.');
    }
  }

  async searchEmployeeExpectNoResults(name: string) {
    await searchProject(this.page, name);
    await this.page.waitForTimeout(1000);
    const noData = this.page.locator('td.dataTables_empty');
    try {
      await expect(noData).toBeVisible({ timeout: 5000 });
    } catch {
      throw new Error(`Expected no records for search "${name}" but records were found.`);
    }
  }

  async clearSearch() {
    const searchBox = this.page.locator('#dt-search-0').first();
    await searchBox.clear();
    await searchBox.press('Enter');
    await this.page.waitForTimeout(800);
  }

  async assertTableHasRecords() {
    const dataRow = this.page
      .locator('table tbody tr')
      .filter({ hasNot: this.page.locator('td.dataTables_empty') });
    try {
      await expect(dataRow.first()).toBeVisible({ timeout: 10000 });
    } catch {
      throw new Error('Expected records in the pool report table but none were found.');
    }
  }

  async assertPoolReportMenuItemNotVisible() {
    const menuItem = this.page.locator('span.fs-6.ms-2', { hasText: 'Pool Report' });
    const isVisible = await menuItem.isVisible().catch(() => false);
    if (isVisible) {
      throw new Error('Pool Report navigation item should not be visible for this role.');
    }
  }

  async assertEditIconNotVisible() {
    const editIcons = this.page.locator('table tbody tr i.ri-edit-2-line');
    const count = await editIcons.count();
    if (count > 0) {
      throw new Error(
        `Edit icons should not be visible for read-only role, but ${count} were found in the table.`
      );
    }
  }

  async assertRemoveIconNotVisible() {
    const removeIcons = this.page.locator('table tbody tr i.ri-user-minus-fill');
    const count = await removeIcons.count();
    if (count > 0) {
      throw new Error(
        `Remove-from-pool icons should not be visible for read-only role, but ${count} were found in the table.`
      );
    }
  }

  async assertTrainingPlanValue(expectedText: string) {
    const field = this.page.locator('#pool_detail_training_plan');
    try {
      await expect(field).toHaveValue(expectedText);
    } catch {
      throw new Error(`Expected training plan field to contain "${expectedText}" but found a different value.`);
    }
  }

  async assertCommentsValue(expectedText: string) {
    const field = this.page.locator('#pool_detail_comments');
    try {
      await expect(field).toHaveValue(expectedText);
    } catch {
      throw new Error(`Expected comments field to contain "${expectedText}" but found a different value.`);
    }
  }

  async assertInterviewRejectedValue(expectedText: string) {
    const field = this.page.locator('#pool_detail_interview_rejected');
    try {
      await expect(field).toHaveValue(expectedText);
    } catch {
      throw new Error(`Expected interview rejected field to contain "${expectedText}" but found a different value.`);
    }
  }

  async clickEmployeeProfileLink(employeeName: string) {
    await filterTableBySearch(this.page, employeeName);
    const nameCell = this.page
      .locator('table tbody tr td')
      .filter({ hasText: employeeName })
      .first();
    try {
      await expect(nameCell).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`Employee profile link not found for: "${employeeName}".`);
    }
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      nameCell.locator('a[href*="/users/"][href*="public_profile"]').click(),
    ]);
    await newPage.waitForLoadState('networkidle');
    this.page = newPage;
  }

  async assertProfilePageOpened(_employeeName: string) {
    try {
      await expect(this.page).toHaveURL(/\/users\/\d+\/public_profile/, { timeout: 20000 });
    } catch {
      throw new Error('Employee public profile page did not open.');
    }
    try {
      await expect(this.page.locator('main, #main-content, .container, body > div').first()).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Employee profile page content did not load.');
    }
  }
}
