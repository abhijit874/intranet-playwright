import { expect, Dialog, Locator, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import { filterTableBySearch } from '../../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin';

// Generic message shown (inside the action modal) for any record that cannot be
// approved because the employee is over the allowed quota for that category.
export const QUOTA_EXCEEDED_MESSAGE =
  'The submitted activities for this employee exceed the allowed quota in this category.';

export type ContributionSearchParams = {
  title: string;
  date: string;
  employeeName: string;
  category: string;
  subcategory: string;
};

export class ContributionsApprovalPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  // --- Navigation ---

  async navigateToContributionsApproval() {
    await this.page.getByText('Activity and Benefits').click();
    await this.page.getByText('Contributions - Approval').click();
  }

  // --- Approval flow ---

  // Filters the pending table down to a single record. The table is paginated
  // (10 rows/page by default) so we drive the DataTables Search box — which
  // filters across every page — and only then match the remaining fields.
  async findApprovalRow({ title, date, employeeName, category, subcategory }: ContributionSearchParams) {
    await this.filterTableBy(title);

    let row = this.page
      .locator('table tbody tr', { hasText: title })
      .filter({ hasText: employeeName });
    if (category) row = row.filter({ hasText: category });
    if (subcategory) row = row.filter({ hasText: subcategory });
    if (date) row = row.filter({ hasText: this.toDisplayDate(date) });
    row = row.first();

    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(
        `Approval row not found for title: "${title}", employee: "${employeeName}", date: "${date}".`
      );
    }
    return row;
  }

  // Types a term into the table's Search box so matching rows from any page are
  // surfaced. Falls back silently if no search input is present.
  private async filterTableBy(term: string) {
    await filterTableBySearch(this.page, term);
  }

  // The form/test supply dates as yyyy/mm/dd (or yyyy-mm-dd); the table renders
  // them as dd/mm/yyyy. Convert so the row filter matches what is displayed.
  private toDisplayDate(date: string): string {
    const m = date.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
  }

  async openActionModal(params: ContributionSearchParams) {
    const row = await this.findApprovalRow(params);
    const actionTarget = row.locator('[data-bs-target="#actionModal"][data-contribution-id]').first();
    try {
      await expect(actionTarget).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(
        `Action button not found for contribution: "${params.title}" by "${params.employeeName}".`
      );
    }
    await actionTarget.scrollIntoViewIfNeeded();
    await actionTarget.click({ force: true });
    const modal = this.page.locator('#actionModal, .modal.show, .modal[aria-modal="true"]').last();
    try {
      await expect(modal).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Action modal did not open after clicking the action button.');
    }
    return modal;
  }

  async fillDeductionAmount(amount: string) {
    await this.page.locator('#deduction_amt_input').fill(amount);
  }

  async fillDeductionReason(reason: string) {
    await this.page.locator('#deduction_reason_input').fill(reason);
  }

  async clickApproveInModal() {
    const modal = this.page.locator('#actionModal, .modal.show, .modal[aria-modal="true"]').last();
    const approvedButton = modal
      .locator('button:has-text("Approve"), input[value="Approve"], a:has-text("Approve"), [role="button"]:has-text("Approve")')
      .first();
    if ((await approvedButton.count()) && (await approvedButton.isEnabled())) {
      await approvedButton.click();
    } else {
      throw new Error('No approvable action found in modal.');
    }
  }

  // Approves the contribution if it is eligible. If the record is over quota the
  // modal shows the generic quota-exceeded message instead — that is asserted and
  // the modal is closed (the record cannot be approved). Returns the outcome.
  async approveContribution(params: ContributionSearchParams): Promise<'approved' | 'quota-blocked'> {
    const modal = await this.openActionModal(params);
    return this.resolveActionModal(modal);
  }

  // Approves the first pending record in the table, whatever it is — for runs
  // against existing data, where any pending record proves the approval flow.
  // Returns null when nothing is pending (so the caller can create a record).
  async approveFirstPending(): Promise<'approved' | 'quota-blocked' | null> {
    const actionable = this.page
      .locator('table tbody tr')
      .filter({ has: this.page.locator('[data-bs-target="#actionModal"][data-contribution-id]') });
    const row = actionable.first();
    try {
      await expect(row).toBeVisible({ timeout: 10000 });
    } catch {
      return null; // approval queue is empty
    }

    const actionTarget = row.locator('[data-bs-target="#actionModal"][data-contribution-id]').first();
    await actionTarget.scrollIntoViewIfNeeded();
    await actionTarget.click({ force: true });
    const modal = this.modalLocator();
    try {
      await expect(modal).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Action modal did not open for the first pending record.');
    }
    return this.resolveActionModal(modal);
  }

  // Opens the action modal of the first pending record that can take a
  // deduction — i.e. whose modal shows the deduction fields and no quota
  // warning. Scans up to `limit` pending rows, closing unsuitable modals along
  // the way. Returns null when no such record is pending.
  async openFirstDeductibleModal(limit = 8): Promise<Locator | null> {
    const actionButtons = this.page.locator(
      'table tbody tr [data-bs-target="#actionModal"][data-contribution-id]'
    );
    try {
      await expect(actionButtons.first()).toBeVisible({ timeout: 10000 });
    } catch {
      return null; // approval queue is empty
    }

    const count = Math.min(await actionButtons.count(), limit);
    for (let i = 0; i < count; i++) {
      const button = actionButtons.nth(i);
      await button.scrollIntoViewIfNeeded();
      await button.click({ force: true });
      const modal = this.modalLocator();
      try {
        await expect(modal).toBeVisible({ timeout: 20000 });
      } catch {
        continue;
      }

      const quotaShown = await modal
        .getByText(QUOTA_EXCEEDED_MESSAGE)
        .isVisible()
        .catch(() => false);
      const canDeduct = await this.page
        .locator('#deduction_amt_input')
        .isVisible()
        .catch(() => false);
      if (!quotaShown && canDeduct) return modal;

      await modal.locator('button[aria-label="Close"][data-bs-dismiss="modal"]').first().click();
      await expect(modal).toBeHidden({ timeout: 10000 }).catch(() => undefined);
    }
    return null;
  }

  // Shared tail of the approval flow: the modal either shows the quota-exceeded
  // message (record cannot be approved) or offers an enabled Approve action.
  private async resolveActionModal(modal: Locator): Promise<'approved' | 'quota-blocked'> {
    const quotaWarning = modal.getByText(QUOTA_EXCEEDED_MESSAGE);
    if (await quotaWarning.isVisible().catch(() => false)) {
      // Over quota — cannot be approved; assert the message the system shows.
      await expect(quotaWarning).toBeVisible();
      await modal.locator('button[aria-label="Close"][data-bs-dismiss="modal"]').first().click();
      return 'quota-blocked';
    }
    const approvedButton = modal
      .locator('button:has-text("Approve"), input[value="Approve"], a:has-text("Approve"), [role="button"]:has-text("Approve")')
      .first();
    if ((await approvedButton.count()) && (await approvedButton.isEnabled())) {
      await approvedButton.click();
      return 'approved';
    }
    throw new Error('No approvable action found in modal.');
  }

  async rejectContribution(params: ContributionSearchParams, reason?: string) {
    const { title, employeeName } = params;
    // Reuse the shared lookup so rejection spans all pages via the search box
    // and matches the table's displayed date format.
    const row = await this.findApprovalRow(params);
    const actionTarget = row.locator('[data-bs-target="#actionModal"][data-contribution-id]').first();
    try {
      await expect(actionTarget).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error(
        `Action button not found for contribution: "${title}" by "${employeeName}".`
      );
    }
    await actionTarget.scrollIntoViewIfNeeded();
    await actionTarget.click({ force: true });

    const rejectButton = this.page.locator('#showRejectBox');
    try {
      await expect(rejectButton).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Reject button not found in the action modal.');
    }
    await rejectButton.click();

    const modal = this.page.locator('#actionModal, .modal.show, .modal[aria-modal="true"]').last();
    try {
      await expect(modal).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Action modal did not open for rejection.');
    }

    const quotaWarning = modal.getByText(QUOTA_EXCEEDED_MESSAGE);
    const rejectionReason =
      reason ?? ((await quotaWarning.isVisible().catch(() => false)) ? QUOTA_EXCEEDED_MESSAGE : 'Rejecting this activity from approval flow.');

    const rejectReasonField = modal
      .locator('#reject_reason:visible, textarea[name="reject_reason"]:visible')
      .first();
    try {
      await expect(rejectReasonField).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Rejection reason text area not found in the modal.');
    }
    await rejectReasonField.fill(rejectionReason);

    const confirmRejectButton = modal
      .locator('button[type="submit"].btn-danger', { hasText: 'Confirm Reject' })
      .first();
    try {
      await expect(confirmRejectButton).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Confirm Reject button not found in the modal.');
    }
    await confirmRejectButton.click();
  }

  // --- Deduction amount validation ---

  // Reads the "Allocated Amount:" value shown in the action modal.
  async getAllocatedAmount(): Promise<number> {
    const modal = this.modalLocator();
    const value = modal
      .locator('dt:has-text("Allocated Amount:") + dd, .approved-amount-display')
      .first();
    try {
      await expect(value).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Allocated Amount field not found in the action modal.');
    }
    const raw = ((await value.textContent()) ?? '').replace(/[^\d.]/g, '');
    const allocated = Number(raw);
    if (!raw || Number.isNaN(allocated)) {
      throw new Error(`Could not parse allocated amount from "${raw}".`);
    }
    return allocated;
  }

  // Clicks Approve in the modal and resolves whichever response the system gives
  // — mirroring approveContribution(), which branches on what is shown rather
  // than assuming one outcome.
  //
  // Invalid input (over-allocation deduction, blank/too-short reason, ...) raises
  // a popup with a single OK button, which we dismiss and whose message we
  // return. The popup may be either a native browser alert() (the 'dialog' event,
  // accepted) OR a custom in-page error dialog (SweetAlert/Bootstrap/etc., whose
  // OK button is clicked) — both are handled. If no popup appears the approval
  // went through, so we return null. Nothing here throws on a missing popup, so a
  // record whose state does not trigger the error is handled gracefully.
  async approveAndCaptureAlert(timeoutMs = 15000): Promise<string | null> {
    // A native alert() fires the 'dialog' event; accept() is its OK click.
    let nativeMessage: string | null = null;
    const dialogHandler = (dialog: Dialog) => {
      nativeMessage = dialog.message();
      dialog.accept().catch(() => {});
    };
    this.page.once('dialog', dialogHandler);

    await this.clickApproveInModal();

    // OK/Okay button of a custom (non-native) error dialog. ":has-text" is a
    // case-insensitive substring match, so the /ok(ay)?/i filter covers both.
    const okButton = this.page
      .locator(
        '.swal2-confirm, .swal-button--confirm, [role="alertdialog"] button, .modal.show .btn'
      )
      .filter({ hasText: /^\s*ok(ay)?\s*$/i })
      .first();
    // The dialog body we read the error text from when it is a custom dialog.
    const customDialog = this.page
      .locator('.swal2-popup, .swal-modal, [role="alertdialog"]')
      .first();

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (nativeMessage !== null) {
        this.page.off('dialog', dialogHandler);
        return nativeMessage;
      }
      if (await okButton.isVisible().catch(() => false)) {
        const message = ((await customDialog.textContent().catch(() => '')) ?? '').trim();
        await okButton.click().catch(() => {});
        this.page.off('dialog', dialogHandler);
        return message;
      }
      await this.page.waitForTimeout(200);
    }

    // No validation popup appeared within the window — approval went through.
    this.page.off('dialog', dialogHandler);
    return null;
  }

  private modalLocator() {
    return this.page.locator('#actionModal, .modal.show, .modal[aria-modal="true"]').last();
  }
}
