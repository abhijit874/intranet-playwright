import { expect, Page } from '@playwright/test';
import { login } from '../../utils/login_helper';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin';

export type RedeemRow = {
  empId: string;
  name: string;
  email: string;
  amount: string; // e.g. "₹3,000"
  redeemDate: string; // e.g. "22-Jul-2026"
  paidDate: string; // "NA" until paid
  status: string; // e.g. "To Pay"
};

// The Redeem Reports page (/redeems/summary): every redemption an employee has
// made, with amount, redeem date and payment status, plus a date-ranged
// "Redeem Invoice Report" CSV download (defaulting to the current month).
export class RedeemReportsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'hr') {
    await login(this.page, user);
  }

  async navigateToRedeemReports() {
    await this.page.getByText('Activity and Benefits').click();
    await this.page.locator('a[href="#reportsMenu"]').click();
    await this.page.locator('span.fs-6.pl-4', { hasText: 'Redeem Reports' }).click();
    try {
      await expect(this.page).toHaveURL(/\/redeems\/summary/, { timeout: 20000 });
    } catch {
      throw new Error('Failed to navigate to the Redeem Reports page.');
    }
  }

  // Reads every redemption row currently shown in the summary table.
  async getRedeemRows(): Promise<RedeemRow[]> {
    const rows = this.page
      .locator('table tbody tr')
      .filter({ hasNot: this.page.locator('td.dataTables_empty') });
    try {
      await expect(rows.first()).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Redeem report table has no rows.');
    }
    return rows.evaluateAll((trs) =>
      trs
        .map((tr) => {
          const td = Array.from(tr.querySelectorAll('td')).map((c) =>
            (c.textContent || '').replace(/\s+/g, ' ').trim()
          );
          // Columns: #, Employee ID, Employee Name, Employee Email, Amount,
          // Redeem Date, Paid Date, Payment Status
          return {
            empId: td[1] ?? '',
            name: td[2] ?? '',
            email: td[3] ?? '',
            amount: td[4] ?? '',
            redeemDate: td[5] ?? '',
            paidDate: td[6] ?? '',
            status: td[7] ?? '',
          };
        })
        .filter((r) => r.empId)
    );
  }

  // Downloads the "Redeem Invoice Report" CSV (the page's Reports dropdown).
  // The export covers the page's default date range: the current month so far.
  async downloadRedeemInvoiceReport(downloadDir: string): Promise<string> {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    await this.page.locator('button[data-bs-toggle="dropdown"]', { hasText: 'Reports' }).click();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('a.dropdown-item', { hasText: 'Redeem Invoice Report' }).click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }
}
