import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { EmployeePage } from '../pages/EmployeePage';

test('download employee CSV', async ({ page }) => {
  test.setTimeout(60000);
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();

  const downloadDir = path.resolve(__dirname, '../downloads');
  const filePath = await employeePage.downloadEmployeeCsv(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);
});
