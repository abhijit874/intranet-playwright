import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { CompanyPage } from '../pages/CompanyPage';
import { processCompanyReportCsv } from '../utils/company_report_filter';
import { csvValueMatches, readCsvRecords } from '../utils/csv_report_filter';

test('download company csv', async ({ page }) => {
  const companyPage = new CompanyPage(page);
  await companyPage.loginAs('hr');
  await companyPage.navigateTo();
  await companyPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await companyPage.downloadCompanyCsv(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  process.env.COMPANY_REPORT_QUERY = process.env.COMPANY_REPORT_QUERY || 'open ai';
  process.env.COMPANY_REPORT_QUERY_FIELD = process.env.COMPANY_REPORT_QUERY_FIELD || 'Name';

  const processed = processCompanyReportCsv(filePath);
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
  expect(processed.filteredRows).toBeGreaterThan(0);

  const filteredRecords = readCsvRecords(processed.filteredPath);
  expect(
    filteredRecords.every((record) =>
      csvValueMatches(record[processed.resolvedQueryField], processed.query)
    )
  ).toBe(true);
});
