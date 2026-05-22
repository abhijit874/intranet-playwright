import { test } from '@playwright/test';
import { TimesheetsPage } from '../pages/TimesheetsPage';

test('create timesheet', async ({ page }) => {
  const timesheetsPage = new TimesheetsPage(page);
  await timesheetsPage.loginAs('employee');
  await timesheetsPage.navigateTo();
  await timesheetsPage.clickAddTimesheet();
  await timesheetsPage.selectProject('Event - Event');
  await timesheetsPage.fillDate(0, '2025-08-24');
  await timesheetsPage.selectDuration(0, '4 hours');
  await timesheetsPage.fillDescription(0, 'creating timesheet with playwright automation');
  await timesheetsPage.submit();
});
