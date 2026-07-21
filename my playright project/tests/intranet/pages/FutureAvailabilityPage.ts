import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { searchProject, filterTableBySearch, dataTableSearchBox } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader';

export class FutureAvailabilityPage {
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

  async navigateToFutureAvailability() {
    await this.page
      .locator('a.btn.btn-outline-secondary.btn-sm[href="/pool_reports/future_pool"]')
      .click();
    try {
      await expect(this.page).toHaveURL(/\/pool_reports\/future_pool/, { timeout: 20000 });
    } catch {
      throw new Error('Failed to navigate to Future Availability page.');
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

  // Returns the employee + project of the first entry in the Future Availability, so
  // tests act on a real upcoming-release row rather than a hardcoded person.
  // Call after navigateToFutureAvailability().
  // Note: "View Past Projects" is offered only on the Innovation Lab tab, so
  // there is no option for it here — see InnovationLabPage.clickViewPastProjects.
  async getFirstFutureAvailabilityEntry(
    opts: { withAddIcon?: boolean } = {}
  ): Promise<{ employee: string; project: string }> {
    let rows = this.page
      .locator('table tbody tr')
      .filter({ hasNot: this.page.locator('td.dataTables_empty') });
    // Employees already in the Innovation Lab have no add-to-Innovation-Lab icon, so a test
    // that adds someone must pick a row that still offers the action.
    if (opts.withAddIcon) {
      rows = rows.filter({ has: this.page.locator('i.ri-user-add-fill') });
    }
    const row = rows.first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(
        opts.withAddIcon
          ? 'Future Availability has no entries that can still be added to the Innovation Lab.'
          : 'Future Availability table has no entries to pick from.'
      );
    }
    const cells = await row.locator('td').allInnerTexts();
    const employee = (cells[1] ?? '').replace(/\s+/g, ' ').trim();
    const project = (cells[4] ?? '').replace(/\s+/g, ' ').trim();
    if (!employee) throw new Error('Could not read an employee name from the Future Availability table.');
    return { employee, project };
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

  async clickAddToInnovationLab(employeeName: string, projectName: string) {
    const row = await this.expectRowVisible(employeeName, projectName);
    const icon = row.locator('i.text-success.ri-user-add-fill.fs-5');
    try {
      await expect(icon).toBeVisible({ timeout: 10000 });
    } catch {
      throw new Error(
        `Add to Innovation Lab button not found for employee "${employeeName}" and project "${projectName}".`
      );
    }
    await icon.click();
  }

  async confirmAddToInnovationLab() {
    await this.page.locator('.modal.show button').filter({ hasText: /Yes, Add to/ }).click();
  }

  async assertAddedToInnovationLab() {
    // Flashes auto-dismiss, so use a single retrying assertion. The trailing
    // wording follows the "Pool" -> "Innovation Lab" rename, so only the stable
    // part of the message is asserted.
    await expect(this.page.locator('#flashes')).toContainText('Successfully added', {
      timeout: 15_000,
    });
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
      throw new Error('Expected records in the Future Availability table but none were found.');
    }
  }

  async assertAddToInnovationLabIconNotVisible() {
    const addIcons = this.page.locator('table tbody tr i.text-success.ri-user-add-fill');
    const count = await addIcons.count();
    if (count > 0) {
      throw new Error(
        `add-to-Innovation-Lab icons should not be visible for read-only role, but ${count} were found in the table.`
      );
    }
  }

  async clickEmployeeProfileLink(employeeName: string) {
    await filterTableBySearch(this.page, employeeName);
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
