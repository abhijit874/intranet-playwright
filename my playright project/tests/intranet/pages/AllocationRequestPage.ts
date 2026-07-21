import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import {
  selectFromSingleSelect2,
  setDateByEvaluate,
  selectRandomOption,
  selectRandomFromAssetDropdown,
} from '../utils/test_helpers';

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
    // The picker's search doesn't match the "(id)" suffix, so search by the email
    // portion only, then click the option whose full text matches.
    const email = emailWithId.split(/\s*\(/)[0].trim();
    await this.page.locator('#select2-employee-container').click();
    const search = this.page.locator('.select2-container--open .select2-search__field').first();
    await expect(search).toBeVisible();
    await search.fill(email);
    const option = this.page
      .locator('.select2-results__option')
      .filter({ hasText: emailWithId })
      .first();
    try {
      await expect(option).toBeVisible({ timeout: 15000 });
    } catch {
      throw new Error(`Employee option not found for: "${emailWithId}".`);
    }
    await option.click();
    await expect(this.page.locator('body .select2-container--open')).toHaveCount(0);
  }

  // Picks a random employee and returns their "email (id)" label. Only safe where
  // the test doesn't depend on the employee's allocation state (a deallocation
  // needs someone who IS allocated; an approval needs someone who is NOT already
  // on the chosen project).
  async selectRandomEmployee(): Promise<string> {
    return selectRandomOption(this.page, '#employee');
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

  async selectRandomAllocationProject(): Promise<string> {
    return selectRandomFromAssetDropdown(this.page, '#select2-allocation_project-container');
  }

  // Any billing code is valid and none are asserted, so pick one at random.
  async selectRandomBillingCode(): Promise<string> {
    return selectRandomFromAssetDropdown(
      this.page,
      'span.select2-selection.select2-selection--single[aria-labelledby*="_billing_code-container"], [role="combobox"][aria-labelledby*="_billing_code-container"]'
    );
  }

  async selectBillingCode(code: string) {
    // Open the billing-code select2 and click the exact matching option. Clicking
    // (rather than arrow-key + Enter) is robust on the edit form, where the
    // pre-filled value otherwise makes the keyboard selection hang.
    const container = this.page
      .locator(
        'span.select2-selection.select2-selection--single[aria-labelledby*="_billing_code-container"], [role="combobox"][aria-labelledby*="_billing_code-container"]'
      )
      .first();
    await container.click();
    const search = this.page.locator('.select2-container--open .select2-search__field').first();
    await expect(search).toBeVisible();
    await search.fill(code);
    const option = this.page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasText: new RegExp(`^\\s*${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
      .first();
    try {
      await expect(option).toBeVisible({ timeout: 15000 });
    } catch {
      throw new Error(`Billing code option not found for: "${code}".`);
    }
    await option.click();
    await expect(this.page.locator('body .select2-container--open')).toHaveCount(0);
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

  // Checks the first project the employee is currently allocated to (whatever
  // shows up in the deallocation list), so the test doesn't depend on a specific
  // pre-seeded allocation. Requires the employee to have at least one allocation.
  // Same as checkFirstDeallocationProject but returns null instead of throwing
  // when the employee has no current allocation — lets a caller try another
  // (randomly picked) employee. Uses a short timeout since "absent" is expected.
  async checkFirstDeallocationProjectIfAny(timeout = 3000): Promise<string | null> {
    const checkbox = this.page
      .locator('input[name="allocation_deallocation_request[deallocation_details][project_ids][]"]')
      .first();
    try {
      await expect(checkbox).toBeVisible({ timeout });
    } catch {
      return null;
    }
    return this.readAndCheckDeallocationProject(checkbox);
  }

  async checkFirstDeallocationProject(): Promise<string> {
    const project = await this.checkFirstDeallocationProjectIfAny(10000);
    if (!project) {
      throw new Error('No deallocation project available — the employee has no current allocation.');
    }
    return project;
  }

  // Reads the project label for a deallocation checkbox, ticks it, and returns the
  // label so the caller can reallocate to (or fill feedback for) the same project.
  private async readAndCheckDeallocationProject(
    checkbox: ReturnType<Page['locator']>
  ): Promise<string> {
    let projectName = '';
    const id = await checkbox.getAttribute('id');
    if (id) {
      projectName = ((await this.page.locator(`label[for="${id}"]`).textContent().catch(() => '')) ?? '').trim();
    }
    if (!projectName) {
      const container = this.page.locator('label, .form-check, tr').filter({ has: checkbox }).first();
      projectName = ((await container.innerText().catch(() => '')) ?? '').trim();
    }
    await checkbox.check();
    return projectName;
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
