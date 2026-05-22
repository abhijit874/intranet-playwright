import { test } from '@playwright/test';
import { TimesheetsPage } from '../pages/TimesheetsPage';

test('export monthly timesheet report', async ({ page }) => {
  const timesheetsPage = new TimesheetsPage(page);
  await timesheetsPage.loginAs('hr');
  await timesheetsPage.navigateToReports();
  await timesheetsPage.clickExportReports();
  await timesheetsPage.clickMonthlyTimesheetReport();
  await timesheetsPage.fillMonthlyFromDate('2025-11-01');
  await timesheetsPage.fillMonthlyToDate('2025-11-26');
  await timesheetsPage.submitMonthlyReport();
});
