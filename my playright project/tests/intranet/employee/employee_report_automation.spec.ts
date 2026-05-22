import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { EmployeePage } from '../pages/EmployeePage';
import { processEmployeeReportCsv } from '../utils/employee_report_filter';

test('employee report automation - download and process csv', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await employeePage.downloadEmployeeCsv(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);

  const processed = processEmployeeReportCsv(filePath);
  console.log(
    `Employee report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
