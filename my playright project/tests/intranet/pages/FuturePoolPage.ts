import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { searchProject, filterTableBySearch } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader';

export class FuturePoolPage {
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

  async navigateToFuturePool() {
    await this.page
      .locator('a.btn.btn-outline-secondary.btn-sm[href="/pool_reports/future_pool"]')
      .click();
    try {
      await expect(this.page).toHaveURL(/\/pool_reports\/future_pool/, { timeout: 20000 });
    } catch {
      throw new Error('Failed to navigate to Future Pool page.');
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

  async clickAddToPool(employeeName: string, projectName: string) {
    const row = await this.expectRowVisible(employeeName, projectName);
    const icon = row.locator('i.text-success.ri-user-add-fill.fs-5');
    try {
      await expect(icon).toBeVisible({ timeout: 10000 });
    } catch {
      throw new Error(
        `Add to pool button not found for employee "${employeeName}" and project "${projectName}".`
      );
    }
    await icon.click();
  }

  async confirmAddToPool() {
    await this.page.locator('span.d-flex.align-items-center', { hasText: 'Yes, Add to Pool' }).click();
  }

  async assertAddedToPool() {
    const alert = this.page.locator('#flashes');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveClass(/alert-success/);
    await expect(alert).toContainText('Successfully added');
    await expect(alert).toContainText('to the pool.');
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
      throw new Error('Expected records in the future pool table but none were found.');
    }
  }

  async assertAddToPoolIconNotVisible() {
    const addIcons = this.page.locator('table tbody tr i.text-success.ri-user-add-fill');
    const count = await addIcons.count();
    if (count > 0) {
      throw new Error(
        `Add-to-Pool icons should not be visible for read-only role, but ${count} were found in the table.`
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
