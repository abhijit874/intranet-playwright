import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import { selectFromSingleSelect2 } from '../../utils/test_helpers';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export class ActivitiesPage {
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

  async navigateToContributionsApproval() {
    await this.page.getByText('Activity and Benefits').click();
    await this.page.getByText('Contributions - Approval').click();
  }

  async navigateToBepReports() {
    await this.page.getByText('Activity and Benefits').click();
    await this.page.locator('a[href="#reportsMenu"]').click();
    await this.page.locator('span.fs-6.pl-4', { hasText: 'BEP Reports' }).click();
  }

  async navigateToCreateLdRecord() {
    await this.page.getByText('Activity and Benefits').click();
    await this.page.locator('span.fs-6.pl-4', { hasText: 'Create L&D record' }).click();
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

  async fillTitle(title: string) {
    await this.page.getByText('Title:').fill(title);
  }

  async fillDate(date: string) {
    await this.page.getByText('Activity Date:').fill(date);
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
    const flash = this.page.locator('#flashes');
    const alert = this.page.getByRole('alert');
    if (await flash.count()) {
      await expect(flash).toContainText(/saved successfully|success|created|submitted/i);
      return;
    }
    await expect(alert).toContainText(/saved successfully|success|created|submitted/i);
  }

  async assertUpdated() {
    const flash = this.page.locator('#flashes');
    const alert = this.page.getByRole('alert');
    if (await flash.count()) {
      await expect(flash).toContainText(/updated|saved successfully|success/i);
      return;
    }
    await expect(alert).toContainText(/updated|saved successfully|success/i);
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
    const row = this.page.locator('table tbody tr', { hasText: title }).first();
    await expect(row).toBeVisible({ timeout: 20000 });
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

  async submitEdit() {
    await this.page.getByRole('button', { name: /update|submit|save/i }).click();
  }

  // --- Approval flow ---

  async findApprovalRow(title: string, date: string, employeeName: string) {
    const row = this.page
      .locator('table tbody tr', { hasText: title })
      .filter({ hasText: date })
      .filter({ hasText: employeeName })
      .first();
    await expect(row).toBeVisible({ timeout: 20000 });
    return row;
  }

  async openActionModal(title: string, date: string, employeeName: string) {
    const row = await this.findApprovalRow(title, date, employeeName);
    const actionTarget = row.locator('[data-bs-target="#actionModal"][data-contribution-id]').first();
    await expect(actionTarget).toBeVisible({ timeout: 20000 });
    await actionTarget.scrollIntoViewIfNeeded();
    await actionTarget.click({ force: true });
    const modal = this.page.locator('#actionModal, .modal.show, .modal[aria-modal="true"]').last();
    await expect(modal).toBeVisible({ timeout: 20000 });
    return modal;
  }

  async approveContribution(title: string, date: string, employeeName: string) {
    const modal = await this.openActionModal(title, date, employeeName);
    const quotaWarning = modal.getByText(
      'The submitted activities for this employee exceed the allowed quota in this category.'
    );
    if (await quotaWarning.isVisible().catch(() => false)) {
      await modal.locator('button[aria-label="Close"][data-bs-dismiss="modal"]').first().click();
      return;
    }
    const approvedButton = modal
      .locator('button:has-text("Approve"), input[value="Approve"], a:has-text("Approve"), [role="button"]:has-text("Approve")')
      .first();
    if ((await approvedButton.count()) && (await approvedButton.isEnabled())) {
      await approvedButton.click();
    } else {
      throw new Error('No approvable action found in modal.');
    }
  }

  async rejectContribution(title: string, date: string, employeeName: string, reason?: string) {
    const row = this.page
      .locator('table tbody tr', { hasText: title })
      .filter({ hasText: date })
      .filter({ hasText: employeeName })
      .first();
    if (!(await row.count()) || !(await row.isVisible().catch(() => false))) {
      throw new Error('Record not found for rejection.');
    }
    const actionTarget = row.locator('[data-bs-target="#actionModal"][data-contribution-id]').first();
    await expect(actionTarget).toBeVisible({ timeout: 20000 });
    await actionTarget.scrollIntoViewIfNeeded();
    await actionTarget.click({ force: true });

    const rejectButton = this.page.locator('#showRejectBox');
    await expect(rejectButton).toBeVisible({ timeout: 20000 });
    await rejectButton.click();

    const modal = this.page.locator('#actionModal, .modal.show, .modal[aria-modal="true"]').last();
    await expect(modal).toBeVisible({ timeout: 20000 });

    const quotaWarningText =
      'The submitted activities for this employee exceed the allowed quota in this category.';
    const quotaWarning = modal.getByText(quotaWarningText);
    const rejectionReason =
      reason ?? ((await quotaWarning.isVisible().catch(() => false)) ? quotaWarningText : 'Rejecting this activity from approval flow.');

    const rejectReasonField = modal
      .locator('#reject_reason:visible, textarea[name="reject_reason"]:visible')
      .first();
    await expect(rejectReasonField).toBeVisible({ timeout: 20000 });
    await rejectReasonField.fill(rejectionReason);

    const confirmRejectButton = modal
      .locator('button[type="submit"].btn-danger', { hasText: 'Confirm Reject' })
      .first();
    await expect(confirmRejectButton).toBeVisible({ timeout: 20000 });
    await confirmRejectButton.click();
  }

  // --- BEP Reports ---

  async selectBepYear(year: string) {
    await this.page.locator('#year').selectOption(year);
  }

  async selectBepQuarter(quarter: string) {
    await this.page.locator('#quarter').selectOption(quarter);
  }

  async downloadApprovedBenefits(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    await this.page
      .locator('button.btn-outline-secondary[data-bs-toggle="dropdown"]', { hasText: 'Reports' })
      .click();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('a.dropdown-item', { hasText: 'Approved Benefits Report' }).click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }

  async downloadActivityReport(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    await this.page
      .locator('button.btn-outline-secondary[data-bs-toggle="dropdown"]', { hasText: 'Reports' })
      .click();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page
        .locator('a.dropdown-item[href*="download_activity_csv"]', { hasText: 'Activity Report' })
        .click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
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
}
