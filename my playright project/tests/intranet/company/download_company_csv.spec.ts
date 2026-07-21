import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { CompanyPage } from '../pages/CompanyPage';
import { CompanyReportsPage } from '../pages/CompanyReportsPage';
import { processCompanyReportCsv } from '../utils/company_report_filter';
import { csvValueMatches, readCsvRecords } from '../utils/csv_report_filter';
import { createCompany } from './company_helpers';

// Self-contained: creates a company, then downloads the company CSV and filters it
// for that exact company — rather than relying on a pre-seeded name ("open ai")
// still existing in the export.
test('download company csv', async ({ page }) => {
  const companyPage = new CompanyPage(page);
  await companyPage.loginAs('hr');
  await companyPage.navigateTo();
  const { name } = await createCompany(companyPage);

  const companyReportsPage = new CompanyReportsPage(page);
  await companyReportsPage.navigateTo();
  await companyReportsPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await companyReportsPage.downloadCompanyCsv(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  // Filter the export for the company this test just created.
  process.env.COMPANY_REPORT_QUERY = name;
  process.env.COMPANY_REPORT_QUERY_FIELD = 'Name';

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
