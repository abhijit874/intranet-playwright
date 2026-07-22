import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { RedeemReportsPage } from '../pages/activities/RedeemReportsPage';

// Months as the Redeem Date column renders them, e.g. "22-Jul-2026".
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isInCurrentMonth(redeemDate: string): boolean {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(redeemDate.trim());
  if (!m) return false;
  const now = new Date();
  return m[2] === MONTHS[now.getMonth()] && Number(m[3]) === now.getFullYear();
}

test('view redeem report', async ({ page }) => {
  const redeemReports = new RedeemReportsPage(page);
  await redeemReports.loginAs('hr');
  await redeemReports.navigateToRedeemReports();

  // The suite itself performs redemptions, so the report must have rows —
  // each with an amount and a payment status.
  const rows = await redeemReports.getRedeemRows();
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(row.amount, `amount missing for ${row.name}`).toMatch(/₹\s*[\d,]+/);
    expect(row.status, `payment status missing for ${row.name}`).toBeTruthy();
    expect(row.redeemDate, `redeem date missing for ${row.name}`).toMatch(/\d{1,2}-[A-Za-z]{3}-\d{4}/);
  }
});

test('download redeem invoice report', async ({ page }) => {
  const redeemReports = new RedeemReportsPage(page);
  await redeemReports.loginAs('hr');
  await redeemReports.navigateToRedeemReports();
  const rows = await redeemReports.getRedeemRows();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await redeemReports.downloadRedeemInvoiceReport(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  // The export covers the current month; every redemption the summary shows
  // for this month must therefore appear in it. (If no redemption happened
  // this month yet there is nothing to cross-check — the download itself is
  // the assertion then.)
  const currentMonthRows = rows.filter((r) => isInCurrentMonth(r.redeemDate));
  const csv = fs.readFileSync(filePath, 'utf-8').toLowerCase();
  for (const row of currentMonthRows) {
    expect(
      csv.includes(row.email.toLowerCase()) || csv.includes(row.name.toLowerCase()),
      `Redemption by ${row.name} (${row.redeemDate}) is missing from the invoice export.`
    ).toBe(true);
  }
  console.log(
    `Redeem invoice report saved: ${filePath}. Cross-checked ${currentMonthRows.length} current-month redemption(s).`
  );
});
