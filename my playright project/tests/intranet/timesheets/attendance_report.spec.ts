import { test } from '@playwright/test';
import * as path from 'path';
import { TimesheetsPage } from '../pages/TimesheetsPage';

test('upload attendance report and send to managers', async ({ page }) => {
  const timesheetsPage = new TimesheetsPage(page);
  await timesheetsPage.loginAs('hr');
  await timesheetsPage.navigateToReports();
  await timesheetsPage.clickExportReports();
  await timesheetsPage.clickTimesheetAttendanceReport();
  await timesheetsPage.fillAttendanceFromDate('2025-08-01');
  await timesheetsPage.fillAttendanceToDate('2025-08-31');
  await timesheetsPage.uploadAttendanceFile(
    path.resolve(__dirname, '../../fixtures/image.png')
  );
  await timesheetsPage.submitAttendanceReport();
});
