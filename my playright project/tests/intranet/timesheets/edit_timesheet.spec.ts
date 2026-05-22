import { test, expect } from '@playwright/test';
import { TimesheetsPage } from '../pages/TimesheetsPage';

test('edit existing timesheet', async ({ page }) => {
  const timesheetsPage = new TimesheetsPage(page);
  await timesheetsPage.loginAs('employee');
  await timesheetsPage.navigateTo();
  await timesheetsPage.clickFirstTimesheetLink();
  await expect(page).toHaveURL(/time_sheets/i);
});
