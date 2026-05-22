import { test } from '@playwright/test';
import { TimesheetsPage } from '../pages/TimesheetsPage';

test('export employee categorisation report', async ({ page }) => {
  const timesheetsPage = new TimesheetsPage(page);
  await timesheetsPage.loginAs('hr');
  await timesheetsPage.navigateToReports();
  await timesheetsPage.clickExportReports();
  await timesheetsPage.clickEmployeeCategorisationReport();
  await timesheetsPage.selectCategorisationMonth('July');
  await timesheetsPage.selectCategorisationYear('2025');
  await timesheetsPage.submitCategorisationReport();
});
