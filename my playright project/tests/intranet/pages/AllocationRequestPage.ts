import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { selectFromSingleSelect2, setDateByEvaluate } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin';

export class AllocationRequestPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.getByText('Allocation and Deallocation').click();
    await expect(this.page).toHaveURL(/\/allocation_deallocation_requests/);
  }

  async clickCreateRequest() {
    await this.page
      .locator('a.btn.btn-secondary[href="/allocation_deallocation_requests/new"]', {
        hasText: 'Create Request',
      })
      .click();
  }

  async selectEmployee(emailWithId: string) {
    await selectFromSingleSelect2(this.page, '#select2-employee-container', emailWithId);
  }

  async checkAllocationCheckbox() {
    await this.page.locator('#allocation_checkbox').check();
  }

  async checkDeallocationCheckbox() {
    await this.page.locator('#deallocation_checkbox').check();
  }

  async selectAllocationProject(name: string) {
    await selectFromSingleSelect2(this.page, '#select2-allocation_project-container', name);
  }

  async selectBillingCode(code: string) {
    await selectFromSingleSelect2(
      this.page,
      'span.select2-selection.select2-selection--single[aria-labelledby*="_billing_code-container"], [role="combobox"][aria-labelledby*="_billing_code-container"]',
      code
    );
  }

  async fillAllocationStart(date: string) {
    await this.page.locator('#allocation_start').fill(date);
  }

  async fillAllocationEnd(date: string) {
    await this.page.locator('#allocation_end').fill(date);
  }

  async fillAllocationHours(hours: string) {
    await this.page.locator('#allocation_hours').fill(hours);
  }

  async fillBillingHours(hours: string) {
    await this.page
      .locator('input[name="allocation_deallocation_request[allocation_details][billing_hours]"]')
      .fill(hours);
  }

  async checkDeallocationProjectByText(projectName: string) {
    const row = this.page
      .locator('tr, .row, .form-check', { hasText: projectName })
      .first();
    await expect(row).toBeVisible();
    await row
      .locator('input[name="allocation_deallocation_request[deallocation_details][project_ids][]"]')
      .first()
      .check();
  }

  async checkDeallocationProjectById(projectId: string) {
    await this.page
      .locator(`input[name="allocation_deallocation_request[deallocation_details][project_ids][]"][value="${projectId}"]`)
      .check();
  }

  async setDeallocationDate(date: string) {
    await setDateByEvaluate(this.page.locator('#deallocation_date'), date);
  }

  async submit() {
    await this.page
      .locator('button.btn.btn-secondary[type="submit"]', { hasText: 'Submit' })
      .click();
  }

  // --- Approval flow ---

  async clickRejectedTab() {
    await this.page.locator('button.nav-link[data-bs-target="#rejected"]').click();
  }

  async clickViewModalOnRow(employeeName: string) {
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: employeeName })
      .first();
    await expect(row).toBeVisible({ timeout: 20000 });
    await row.locator('button.btn.btn-primary.btn-sm[data-bs-toggle="modal"]', { hasText: 'View' }).click();
  }

  async clickEditIconOnRow(employeeName: string) {
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: employeeName })
      .first();
    await expect(row).toBeVisible({ timeout: 20000 });
    await row.locator('i.text-dark.ri-edit-2-line').click();
  }

  async searchRequests(query: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(query);
  }

  async findRequestRow(employeeName: string, type?: 'deallocation' | 'allocation') {
    let row = this.page.locator('table tbody tr', { hasText: employeeName });
    if (type) row = row.filter({ hasText: new RegExp(type, 'i') });
    const first = row.first();
    await expect(first).toBeVisible({ timeout: 20000 });
    return first;
  }

  async clickViewOnRow(employeeName: string, type?: 'deallocation' | 'allocation') {
    const row = await this.findRequestRow(employeeName, type);
    await row
      .locator(
        'a:has-text("View"), button:has-text("View"), a[href*="/allocation_deallocation_requests/"]'
      )
      .first()
      .click();
  }

  async approveRequest(sendEmail = true) {
    if (sendEmail) {
      await this.page.locator('input[name="send_deallocation_email"][form="approveForm"]').check();
    }
    await this.page.locator('button.btn.btn-success', { hasText: 'Approve' }).click();
  }

  async clickRejectButton() {
    await this.page.locator('button#rejectToggle.btn.btn-danger').click();
  }

  async fillRejectReason(reason: string) {
    await this.page.locator('textarea[name="reject_reason"]').fill(reason);
  }

  async confirmReject() {
    await this.page.locator('button.btn.btn-danger', { hasText: 'Confirm Reject' }).click();
  }

  async assertRequestRejected() {
    const flash = this.page.locator('#flashes');
    await expect(flash).toBeVisible({ timeout: 20000 });
    await expect(flash).toContainText('Request rejected successfully.');
  }

  async assertRequestCreated() {
    const flash = this.page.locator('#flashes');
    await expect(flash).toBeVisible({ timeout: 20000 });
    await expect(flash).toContainText('Request created successfully.');
  }
}
