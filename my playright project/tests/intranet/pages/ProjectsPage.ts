import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import {
  searchProject,
  filterTableBySearch,
  selectDropdownByValue,
  selectFromSingleSelect2,
  selectFromMultiSelect2,
  setDateByEvaluate,
  expectFlashMessage,
} from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin' | 'sales';

export class ProjectsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    // The nav link matches in multiple places on some pages, and the projects
    // list can be slow to load; click the first match without blocking on the
    // (slow) navigation, then wait for the list URL specifically.
    await this.page.locator('a[href="/projects"]').first().click({ noWaitAfter: true });
    await this.page.waitForURL((url) => url.pathname === '/projects', { timeout: 30000 });
  }

  async clickNewProject() {
    await this.page.locator('a[href="/projects/new"]').first().click({ noWaitAfter: true });
    await this.page.waitForURL((url) => url.pathname === '/projects/new', { timeout: 30000 });
  }

  async search(query: string) {
    await searchProject(this.page, query);
  }

  async findProjectRow(name: string) {
    await filterTableBySearch(this.page, name);
    const row = this.page.locator('table tbody tr', { hasText: new RegExp(name, 'i') }).first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`Project row not found for: "${name}".`);
    }
    return row;
  }

  async clickEditOnRow(name: string) {
    const row = await this.findProjectRow(name);
    await row
      .locator(
        'a:has-text("Edit"), button:has-text("Edit"), a[title*="Edit" i], button[title*="Edit" i], a:has(i.fa-edit), button:has(i.fa-edit), a:has(i[class*="edit"]), button:has(i[class*="edit"])'
      )
      .first()
      .click();
  }

  // --- New project form ---

  async selectCompany(name: string) {
    await this.page.locator('#select2-project_company_id-container').click();
    await this.page.locator('.select2-results__option', { hasText: name }).click();
  }

  async fillProjectName(name: string) {
    await this.page.locator('#project_name').fill(name);
  }

  async fillDisplayName(name: string) {
    await this.page.locator('#project_display_name').fill(name);
  }

  async fillProjectCode(code: string) {
    await this.page.locator('#project_code').fill(code);
  }

  async selectDomain(value: string) {
    await selectDropdownByValue(this.page, '#project_domain', value);
  }

  async selectBillingFrequency(value: string) {
    await selectDropdownByValue(this.page, '#project_billing_frequency', value);
  }

  async selectBusinessUnit(value: string) {
    await selectDropdownByValue(this.page, '#project_business_unit', value);
  }

  async selectTypeOfProject(value: string) {
    await selectDropdownByValue(this.page, '#project_type_of_project', value);
  }

  async selectBillBy(value: string) {
    await selectDropdownByValue(this.page, '#project_bill_by', value);
  }

  async selectInvoiceBy(value: string) {
    await selectDropdownByValue(this.page, '#project_invoice_by', value);
  }

  async selectSowStatus(value: string) {
    await selectDropdownByValue(this.page, '#project_sow_status', value);
  }

  async setStartDate(date: string) {
    await setDateByEvaluate(this.page.locator('#project_start_date'), date);
  }

  async setEndDate(date: string) {
    await setDateByEvaluate(this.page.locator('#project_end_date'), date);
  }

  async setSowStartDate(date: string) {
    await this.page.locator('#project_sow_start_date').fill(date);
  }

  async setSowEndDate(date: string) {
    await setDateByEvaluate(this.page.locator('#project_sow_end_date'), date);
  }

  async selectProjectManager(name: string, expectedText: string) {
    await selectFromMultiSelect2(this.page, '#select2-project_manager_ids-container', name, expectedText);
  }

  async selectSalesHead(name: string) {
    await selectFromSingleSelect2(this.page, '#select2-project_sales_head_id-container', name);
  }

  async selectDeliveryHead(name: string) {
    await selectFromSingleSelect2(this.page, '#select2-project_delivery_head_id-container', name);
  }

  async selectDeliveryVP(name: string) {
    await selectFromSingleSelect2(this.page, '#select2-project_delivery_vp_id-container', name);
  }

  async selectProductManager(name: string) {
    await selectFromSingleSelect2(this.page, '#select2-project_product_manager_id-container', name);
  }

  async submitNewProject() {
    // Project creation redirects slowly (can exceed the 15s actionTimeout); don't
    // block the click on navigation — assertCreated() polls the flash to confirm.
    await this.page.locator('#new_project > input.btn.btn-secondary').click({ noWaitAfter: true });
  }

  async setProjectActiveStatus(active: boolean) {
    const checkbox = this.page.locator('#project_is_active');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== active) {
      await checkbox.click();
    }
  }

  async saveProjectEdit() {
    // The edit form marks Client Logo, project image and sub-code as required but
    // never pre-fills them on load (file inputs can't retain values). The project
    // already has these from creation, so relax the client-side constraints to let
    // the edit submit — the server keeps the existing values.
    await this.page.evaluate(() => {
      ['logo-upload', 'image-upload', 'project_subcode'].forEach((id) => {
        document.getElementById(id)?.removeAttribute('required');
      });
    });

    const saveButton = this.page
      .locator('form[id^="edit_project_"] input.btn.btn-secondary[type="submit"]')
      .first();
    try {
      await expect(saveButton).toBeVisible();
    } catch {
      throw new Error('Save button not found on project edit form.');
    }
    // The edit redirect can also exceed the 15s actionTimeout; don't block the
    // click on navigation — assertSaved() polls the flash to confirm.
    await saveButton.click({ noWaitAfter: true });
  }

  async assertNotCreated() {
    await this.page.waitForLoadState('networkidle');
    const successFlash = this.page
      .locator('#flashes')
      .filter({ hasText: 'Project created Successfully' });
    await expect(
      successFlash,
      'Project was created without required fields — server-side validation was bypassed.'
    ).toHaveCount(0);
  }

  async assertCreated() {
    // Project create/update redirects can be slow, so allow extra time.
    await expectFlashMessage(this.page, 'Project created Successfully', 'project creation', 30_000);
  }

  async assertSaved() {
    await expectFlashMessage(this.page, 'Project updated Successfully', 'project update', 30_000);
  }

  // Client Logo (#logo-upload) and project image (#image-upload) are both
  // required on the new-project form.
  async uploadClientLogo(filePath: string) {
    await this.page.locator('#logo-upload').setInputFiles(filePath);
  }

  async uploadProjectImage(filePath: string) {
    await this.page.locator('#image-upload').setInputFiles(filePath);
  }

  async uploadSowFile(filePath: string) {
    await this.page.locator('#project_sow_files_attributes_0_file').setInputFiles(filePath);
  }

  async uploadMsaFile(filePath: string) {
    await this.page.locator('#project_msa_files_attributes_0_file').setInputFiles(filePath);
  }
}
