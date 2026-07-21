import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { searchProject, filterTableBySearch, dataTableSearchBox } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader' | 'sales';

export class InnovationLabPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.locator('a[href="/pool_reports"]').click();
    try {
      await expect(this.page).toHaveURL(/\/pool_reports/, { timeout: 20000 });
    } catch {
      throw new Error('Failed to navigate to Innovation Lab page.');
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

  // Returns the employee + project of the first entry actually in the Innovation
  // Lab, so tests act on whoever is really there rather than a hardcoded person
  // who may since have been removed.
  async getFirstInnovationLabEntry(
    opts: { withActions?: boolean; withPastProjectsLink?: boolean } = {}
  ): Promise<{ employee: string; project: string }> {
    let rows = this.page
      .locator('table tbody tr')
      .filter({ hasNot: this.page.locator('td.dataTables_empty') });
    // Not every row exposes the edit/remove actions, so tests that act on a row
    // must pick one that actually has them.
    if (opts.withActions) {
      rows = rows.filter({ has: this.page.locator('i.ri-user-minus-fill') });
    }
    // Likewise, not every row offers "View Past Projects".
    if (opts.withPastProjectsLink) {
      rows = rows.filter({ has: this.page.locator('a[href*="public_profile#emp-details"]') });
    }
    const row = rows.first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      if (opts.withActions) {
        throw new Error('Innovation Lab table has no entries with edit/remove actions.');
      }
      if (opts.withPastProjectsLink) {
        throw new Error('Innovation Lab table has no entries offering a "View Past Projects" link.');
      }
      throw new Error('Innovation Lab table has no entries to pick from.');
    }
    const cells = await row.locator('td').allInnerTexts();
    const employee = (cells[1] ?? '').replace(/\s+/g, ' ').trim();
    const project = (cells[4] ?? '').replace(/\s+/g, ' ').trim();
    if (!employee) throw new Error('Could not read an employee name from the Innovation Lab table.');
    return { employee, project };
  }

  // Every employee currently listed in the Innovation Lab.
  async getInnovationLabEmployees(): Promise<string[]> {
    const rows = this.page
      .locator('table tbody tr')
      .filter({ hasNot: this.page.locator('td.dataTables_empty') });
    try {
      await expect(rows.first()).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Innovation Lab table has no entries to pick from.');
    }
    const names = await rows.evaluateAll((trs) =>
      trs
        .map((tr) => (tr.querySelectorAll('td')[1]?.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    );
    if (!names.length) throw new Error('Could not read any employee names from the Innovation Lab table.');
    return names;
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

  async clickRemoveFromInnovationLab(employeeName: string, projectName: string) {
    const row = await this.expectRowVisible(employeeName, projectName);
    const icon = row.locator('i.text-danger.ri-user-minus-fill');
    try {
      await expect(icon).toBeVisible({ timeout: 10000 });
    } catch {
      throw new Error(
        `Remove from Innovation Lab button not found for employee "${employeeName}" and project "${projectName}".`
      );
    }
    await icon.click();
  }

  async confirmRemoveFromInnovationLab() {
    await this.page.locator('.modal.show button').filter({ hasText: /Yes, Remove from/ }).click();
  }

  async assertRemovedFromInnovationLab() {
    // Flashes auto-dismiss, so use a single retrying assertion. The trailing
    // wording follows the "Pool" -> "Innovation Lab" rename, so only the stable
    // part of the message is asserted.
    await expect(this.page.locator('#flashes')).toContainText('Successfully removed', {
      timeout: 15_000,
    });
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

  // Picks a random proposed project from the dropdown. The list changes over time
  // (the previously hardcoded "AI drones" no longer exists), so tests shouldn't
  // pin a specific one.
  async selectRandomProposedProject(): Promise<string> {
    const control = this.page.locator(
      '.select2-selection--multiple:has(#select2-pool_detail_proposed_projects-container)'
    );
    await control.scrollIntoViewIfNeeded();
    await control.click();

    const options = this.page.locator('#select2-pool_detail_proposed_projects-results li');
    try {
      await expect(options.first()).toBeVisible({ timeout: 15000 });
    } catch {
      throw new Error('Proposed projects dropdown did not open or has no options.');
    }
    const labels = (await options.allTextContents())
      .map((t) => t.trim())
      .filter((t) => t && !/^no results/i.test(t) && !/^searching/i.test(t));
    if (!labels.length) throw new Error('No selectable proposed projects available.');

    const choice = labels[Math.floor(Math.random() * labels.length)];
    await options.filter({ hasText: choice }).first().click();
    return choice;
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

  async assertInnovationLabDetailsUpdated() {
    const alert = this.page.locator('#flashes');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveClass(/alert-success/);
    await expect(alert).toContainText('Data updated successfully for');
  }

  async assertInnovationLabLoaded() {
    try {
      await expect(this.page.locator('table tbody')).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Innovation Lab table did not load.');
    }
  }

  async searchEmployeeExpectNoResults(name: string) {
    await searchProject(this.page, name);
    await this.page.waitForTimeout(1000);
    // The table may render an explicit empty row or simply no rows at all.
    const dataRows = this.page
      .locator('table tbody tr')
      .filter({ hasNot: this.page.locator('td.dataTables_empty') })
      .filter({ hasNotText: /no (matching records|data available)/i });
    try {
      await expect(dataRows).toHaveCount(0, { timeout: 10000 });
    } catch {
      throw new Error(`Expected no records for search "${name}" but records were found.`);
    }
  }

  async clearSearch() {
    const searchBox = dataTableSearchBox(this.page);
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
      throw new Error('Expected records in the Innovation Lab table but none were found.');
    }
  }

  async assertInnovationLabMenuItemNotVisible() {
    const menuItem = this.page.locator('a[href="/pool_reports"]');
    const isVisible = await menuItem.isVisible().catch(() => false);
    if (isVisible) {
      throw new Error('Innovation Lab navigation item should not be visible for this role.');
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
        `Remove-from-Innovation-Lab icons should not be visible for read-only role, but ${count} were found in the table.`
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

  async clickViewPastProjects(employeeName: string) {
    await filterTableBySearch(this.page, employeeName);
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
    try {
      await expect(this.page).toHaveURL(/\/users\/\d+\/public_profile/, { timeout: 20000 });
    } catch {
      throw new Error('Past projects page did not open - expected employee public profile URL.');
    }
  }
}
