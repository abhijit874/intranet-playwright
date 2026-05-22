import { expect, Page, Locator } from '@playwright/test';
import { login } from '../utils/login_helper';
import {
  searchProject,
  selectDropdownByValue,
  selectFromSingleSelect2,
  selectFromMultiSelect2,
  clickFirstVisible,
  setDateByEvaluate,
} from '../utils/test_helpers';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin' | 'sales';

export class ProjectsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.locator('a[href="/projects"]').click();
  }

  async clickNewProject() {
    await this.page.locator('a[href="/projects/new"]').click();
  }

  async search(query: string) {
    await searchProject(this.page, query);
  }

  async findProjectRow(name: string) {
    const row = this.page.locator('table tbody tr', { hasText: new RegExp(name, 'i') }).first();
    await expect(row).toBeVisible({ timeout: 20000 });
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

  async clickDownloadIcon() {
    await this.page.locator('i.ri-file-download-line.fs-3.text-dark').first().click();
  }

  async downloadProjectsReport(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('a.project-report.dropdown-item.fs-6', { hasText: 'Projects Report' }).click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }

  async downloadProjectTeamsReport() {
    await this.page
      .locator('a.project-team-report.dropdown-item.fs-6', { hasText: 'Project Teams Report' })
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
    await this.page.locator('#new_project > input.btn.btn-secondary').click();
  }

  async setProjectActiveStatus(active: boolean) {
    const checkbox = this.page.locator('#project_is_active');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== active) {
      await checkbox.click();
    }
  }

  async saveProjectEdit() {
    const saveButton = this.page
      .locator('form[id^="edit_project_"] input.btn.btn-secondary[type="submit"]')
      .first();
    await expect(saveButton).toBeVisible();
    await saveButton.click();
  }

  // --- Team management ---

  async openTeamDetailsTab() {
    const tab = this.page.locator('a.nav-link.team_details[href="#team_info"][data-bs-toggle="tab"]');
    await expect(tab).toBeVisible();
    await tab.click();
  }

  async addTeamMember(employee: string, startDate: string, endDate: string, billingCode: string) {
    const addButton = this.page.locator(
      'a#add-team-members-button.add_nested_fields.btn.btn-secondary[data-target="#team-members"][data-association="user_projects"]'
    );
    await expect(addButton).toBeVisible();

    const userPickerBefore = this.page.locator(
      '[role="combobox"][aria-labelledby^="select2-user-id-"], span.select2-selection--single[aria-labelledby^="select2-user-id-"]'
    );
    const countBefore = await userPickerBefore.count();
    await addButton.click();
    await expect(userPickerBefore).toHaveCount(countBefore + 1);

    await clickFirstVisible([
      this.page.locator('span.select2-selection.select2-selection--single[aria-labelledby^="select2-user-id-"]').last(),
      this.page.locator('[role="combobox"][aria-labelledby^="select2-user-id-"]').last(),
      this.page.locator('.select2-selection--single[role="combobox"]').last(),
    ]);

    const searchInput = this.page.locator('.select2-container--open .select2-search__field').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(employee);
    await searchInput.press('ArrowDown');
    await searchInput.press('Enter');

    await setDateByEvaluate(
      this.page.locator('input[id^="project_user_projects_attributes_"][id$="_start_date"]').last(),
      startDate
    );
    await setDateByEvaluate(
      this.page.locator('input#end-date, input[id^="project_user_projects_attributes_"][id$="_end_date"]').last(),
      endDate
    );

    const billingCodeSelect = this.page
      .locator(
        'span.select2-selection.select2-selection--single[aria-labelledby*="_billing_code-container"], [role="combobox"][aria-labelledby*="_billing_code-container"]'
      )
      .last();
    await expect(billingCodeSelect).toBeVisible();
    await billingCodeSelect.click();

    const billingInput = this.page.locator('.select2-container--open .select2-search__field').first();
    await expect(billingInput).toBeVisible();
    await billingInput.fill(billingCode);
    await billingInput.press('ArrowDown');
    await billingInput.press('Enter');

    await this.page
      .locator('input[id^="project_user_projects_attributes_"][id$="_allocation"]')
      .last()
      .fill('160');
    await this.page
      .locator('input[id^="project_user_projects_attributes_"][id$="_billing_hrs"]')
      .last()
      .fill('160');
  }

  async uploadSowFile(filePath: string) {
    await this.page.locator('#project_sow_files_attributes_0_file').setInputFiles(filePath);
  }

  async uploadMsaFile(filePath: string) {
    await this.page.locator('#project_msa_files_attributes_0_file').setInputFiles(filePath);
  }

  async saveTeam() {
    const saveButton = this.page.locator('button#save-button[type="button"]');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
  }

  async confirmSave() {
    const confirmButton = this.page.locator('button#confirmSave.btn.btn-primary');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
  }

  async clickEmployeeToggle(employeeText: string) {
    const containers: Locator[] = [
      this.page.locator('tr', { hasText: employeeText }).first(),
      this.page.locator('.nested-fields', { hasText: employeeText }).first(),
      this.page.locator('.row', { hasText: employeeText }).first(),
      this.page.locator('div', { hasText: employeeText }).first(),
    ];
    for (const container of containers) {
      if (!(await container.count())) continue;
      const toggle = container.locator('input.team-active-toggle[role="switch"]').first();
      if (await toggle.count()) {
        await expect(toggle).toBeVisible();
        await toggle.click();
        return;
      }
    }
    throw new Error(`Toggle not found for employee: ${employeeText}`);
  }

  async setEmployeeEndDate(employeeText: string, date: string) {
    const containers: Locator[] = [
      this.page.locator('tr', { hasText: employeeText }).first(),
      this.page.locator('.nested-fields', { hasText: employeeText }).first(),
      this.page.locator('.row', { hasText: employeeText }).first(),
      this.page.locator('div', { hasText: employeeText }).first(),
    ];
    for (const container of containers) {
      if (!(await container.count())) continue;
      const endDateInput = container.locator('#end-date, input[id$="_end_date"]').first();
      if (await endDateInput.count()) {
        await expect(endDateInput).toBeVisible();
        await setDateByEvaluate(endDateInput, date);
        return;
      }
    }
    throw new Error(`End date input not found for employee: ${employeeText}`);
  }
}
