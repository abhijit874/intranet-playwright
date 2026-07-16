import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { filterTableBySearch } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin';

export class AllocationRequestApprovalPage {
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

  async clickRejectedTab() {
    await this.page.locator('button.nav-link[data-bs-target="#rejected"]').click();
  }

  async clickViewModalOnRow(employeeName: string) {
    await filterTableBySearch(this.page, employeeName);
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: employeeName })
      .first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`Request row not found for employee: "${employeeName}".`);
    }
    await row.locator('button.btn.btn-primary.btn-sm[data-bs-toggle="modal"]', { hasText: 'View' }).click();
  }

  async clickEditIconOnRow(employeeName: string) {
    await filterTableBySearch(this.page, employeeName);
    // A rejected request is only editable for 7 days after rejection, so the edit
    // icon appears only on recent rows. Pick the employee's row that actually has
    // the edit icon (not just the first match, which may be an older, un-editable
    // request).
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: employeeName })
      .filter({ has: this.page.locator('i.ri-edit-2-line') })
      .first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(`No editable (within 7 days) rejected request row found for: "${employeeName}".`);
    }
    // Click the edit control (the anchor/button around the pencil icon, falling
    // back to the icon itself), scrolling it into view first.
    const editControl = row
      .locator('a:has(i.ri-edit-2-line), button:has(i.ri-edit-2-line), i.ri-edit-2-line')
      .first();
    await editControl.scrollIntoViewIfNeeded();
    await editControl.click();
  }

  async searchRequests(query: string) {
    await this.page.getByRole('searchbox', { name: 'Search:' }).fill(query);
  }

  async findRequestRow(employeeName: string, type?: 'deallocation' | 'allocation') {
    await filterTableBySearch(this.page, employeeName);
    // The DataTable search already narrows to this employee. The row's display
    // name may differ from an email-derived name (e.g. "Ankitkumar Singh" vs
    // "Ankit Singh"), so match on the last-name token rather than the full string.
    const lastToken = employeeName.trim().split(/\s+/).pop() ?? employeeName;
    let row = this.page.locator('table tbody tr').filter({ hasText: lastToken });
    if (type) row = row.filter({ hasText: new RegExp(type, 'i') });
    const first = row.first();
    try {
      await expect(first).toBeVisible({ timeout: 20000 });
    } catch {
      const typeLabel = type ? ` (${type})` : '';
      throw new Error(`Request row not found for employee: "${employeeName}"${typeLabel}.`);
    }
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

  async clickApproveButton() {
    await this.page.locator('button.btn.btn-success', { hasText: 'Approve' }).click();
  }

  async approveAllocationRequest() {
    await this.page
      .locator('input.form-check-input.deallocation-field[name="send_allocation_email"][form="approveForm"]')
      .check();
    await this.page.locator('button.btn.btn-success', { hasText: 'Approve' }).click();
  }

  // --- Cancel a pending request (done by the admin who created it) ---

  async clickCancelIconOnRow(employeeName: string, type?: 'deallocation' | 'allocation') {
    // Filter to the employee (their newest request sorts to the top), then open
    // the cancel modal from the first matching cancel button.
    await this.findRequestRow(employeeName, type);
    await this.page.waitForTimeout(500);
    await this.page.locator('button[data-bs-target="#cancelRequestModal"]').first().click();
    try {
      await expect(this.page.locator('#cancelRequestModal')).toBeVisible({ timeout: 10000 });
    } catch {
      throw new Error('Cancel request modal did not open.');
    }
  }

  async fillCancelReason(reason: string) {
    const textarea = this.page.locator('#cancelRequestModal textarea[name="cancel_reason"]');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill(reason);
  }

  async confirmCancel() {
    await this.page.locator('#cancelRequestModal button', { hasText: 'Confirm Cancel' }).click();
  }

  async assertRequestCancelled() {
    const alert = this.page.locator('#flashes');
    try {
      await expect(alert).toContainText(/cancel/i, { timeout: 15000 });
    } catch {
      throw new Error('Request cancellation was not confirmed (no cancel success message).');
    }
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

  async assertRequestApproved() {
    const alert = this.page.locator('#flashes');
    try {
      await expect(alert).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Flash message not visible after approving request.');
    }
    try {
      await expect(alert).toHaveClass(/alert-info/);
    } catch {
      throw new Error('Approval failed — UI showed an error or warning instead of success.');
    }
    try {
      await expect(alert).toContainText('Allocation deallocation done successfully.');
    } catch {
      throw new Error('Request was not approved successfully - expected success message not found.');
    }
  }

  async assertRequestRejected() {
    const alert = this.page.locator('#flashes');
    try {
      await expect(alert).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Flash message not visible after rejecting request.');
    }
    try {
      await expect(alert).toHaveClass(/alert-info/);
    } catch {
      throw new Error('Rejection failed — UI showed an error or warning instead of success.');
    }
    try {
      await expect(alert).toContainText('Request rejected successfully.');
    } catch {
      throw new Error('Request was not rejected successfully - expected success message not found.');
    }
  }
}
