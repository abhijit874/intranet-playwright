import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { processCompanyReportCsv } from './intranet/utils/company_report_filter';

test('download company csv', async ({ page }) => {
  await page.goto('https://pg-stage-intranet.joshsoftware.com/');

  // login
  await page.getByPlaceholder('email')
    .fill('saurabh.gaji@joshsoftware.com');

  await page.getByPlaceholder('password')
    .fill('josh123');

  await page.getByRole('button', { name: /sign in/i }).click();

  // navigate to Company section
  await page.getByText('Company').click();

  // open dropdown (icon click)
  await page.locator(
    'body > div.d-flex.h-100 > main > header > ' +
    'div.d-flex.align-items-center.gap-2.ms-auto > ' +
    'a.btn.btn-light.dropdown.p-1 > i'
  ).click();

  // ensure downloads folder exists
  const downloadDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // wait for browser download + click the real download link
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Download Company CSV' }).click()
  ]);

  // save downloaded file
  const filePath = path.join(
    downloadDir,
    download.suggestedFilename()
  );

  await download.saveAs(filePath);

  const processed = processCompanyReportCsv(filePath);
  console.log(
    `Company report saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
  );

  // verify file exists
  expect(fs.existsSync(filePath)).toBe(true);
  expect(fs.existsSync(processed.filteredPath)).toBe(true);
});
