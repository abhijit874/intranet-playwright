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
    try {
      await expect(this.page).toHaveURL(/\/allocation_deallocation_requests/);
    } catch {
      throw new Error('Failed to navigate to Allocation and Deallocation Requests page.');
    }
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
    try {
      await expect(row).toBeVisible();
    } catch {
      throw new Error(`Deallocation project row not found for: "${projectName}".`);
    }
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

  async assertRequestNotCreated() {
    await this.page.waitForLoadState('networkidle');
    const successFlash = this.page
      .locator('#flashes')
      .filter({ hasText: 'Request created successfully.' });
    await expect(
      successFlash,
      'Allocation request was created without required fields — server-side validation was bypassed.'
    ).toHaveCount(0);
  }

  async assertRequestCreated() {
    const alert = this.page.locator('#flashes');
    try {
      await expect(alert).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Flash message not visible after creating request.');
    }
    try {
      await expect(alert).toHaveClass(/alert-info/);
    } catch {
      throw new Error('Request creation failed — UI showed an error or warning instead of success.');
    }
    try {
      await expect(alert).toContainText('Request created successfully.');
    } catch {
      throw new Error('Request was not created successfully - expected success message not found.');
    }
  }
}
