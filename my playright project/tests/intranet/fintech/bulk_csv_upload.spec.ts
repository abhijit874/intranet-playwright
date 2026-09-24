import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { FinTechQuestionsPage } from '../pages/FinTechQuestionsPage';
import { appendQuestionRows, buildInvalidQuestionsCsv } from './fintech_helpers';

const downloadDir = path.resolve(__dirname, '../downloads');

test.describe('FinTech Questions - bulk CSV upload', () => {

  test('bulk upload page opens from the question bank', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openBulkUpload();
    await fintechPage.assertImportPageLoaded();
  });

  test('the page explains the template and offers a file picker', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/import');
    await fintechPage.assertImportPageLoaded();

    await expect(page.getByRole('heading', { name: /Download Template & Guidelines/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Upload CSV File/i })).toBeVisible();
    await expect(page.locator('#file')).toHaveJSProperty('required', true);
    await expect(page.locator('#file')).toHaveAttribute('accept', '.csv');
    await expect(page.getByRole('button', { name: 'Upload & Import Questions' })).toBeVisible();

    // The documented rules the CSV has to satisfy.
    await expect(page.locator('body')).toContainText(
      'Trading, Payment, Core Banking, Investment & Wealth Management, Lending'
    );
    await expect(page.locator('body')).toContainText(
      'CoE,Level,Question,Option A,Option B,Option C,Option D,Correct Option,Explanation,Active'
    );
  });

  test('the sample template downloads as a real file with the documented headers', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/import');
    await fintechPage.assertImportPageLoaded();

    const filePath = await fintechPage.downloadTemplateCsv(downloadDir);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(path.basename(filePath)).toBe('fintech_questions_template.csv');

    const header = fs.readFileSync(filePath, 'utf-8').split('\n')[0].trim();
    expect(header).toBe(
      'CoE,Level,Question,Option A,Option B,Option C,Option D,Correct Option,Explanation,Active'
    );
  });

  // The round trip the module exists for: take the file the app hands out, fill
  // it in, upload it back, and confirm the questions land in the bank.
  //
  // Self-contained — the imported rows are written Active=false (a blank Active
  // column defaults to *true*, which would put throwaway questions in front of
  // real employees) and every one of them is deleted afterwards.
  test('questions filled into the downloaded template import successfully', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openBulkUpload();

    const suffix = `IMP${Date.now().toString().slice(-6)}`;
    const templatePath = await fintechPage.downloadTemplateCsv(downloadDir);
    const template = fs.readFileSync(templatePath, 'utf-8');

    const uploadPath = path.join(downloadDir, `fintech_questions_${suffix}.csv`);
    fs.writeFileSync(uploadPath, appendQuestionRows(template, suffix, 2));

    try {
      await page.goto('/fintech_questions/import');
      await fintechPage.assertImportPageLoaded();
      await fintechPage.uploadQuestionsCsv(uploadPath);
      await fintechPage.assertImportSucceeded(2);

      // Both rows must be in the bank with the values the CSV carried.
      await page.goto(`/fintech_questions?show_inactive=true&search=${suffix}`);
      await fintechPage.assertListLoaded();
      await expect(fintechPage.rows()).toHaveCount(2);

      const coes = await fintechPage.columnValues(2);
      const levels = await fintechPage.columnValues(3);
      const questions = await fintechPage.columnValues(4);
      expect(coes.sort()).toEqual(['Lending', 'Payment']);
      expect(levels.sort()).toEqual(['Easy', 'Hard']);
      expect(questions.every((q) => q.includes(suffix))).toBe(true);

      // Imported as inactive, so the active-only list must not show them.
      await page.goto(`/fintech_questions?show_inactive=false&search=${suffix}`);
      await fintechPage.assertListLoaded();
      await expect(fintechPage.rows()).toHaveCount(0);
    } finally {
      await fintechPage.deleteAllQuestionsMatching(suffix);
      fs.rmSync(uploadPath, { force: true });
    }
  });

  test('a CSV row with an unknown CoE is rejected and reported', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/import');
    await fintechPage.assertImportPageLoaded();

    const suffix = `IMP${Date.now().toString().slice(-6)}`;
    const templatePath = await fintechPage.downloadTemplateCsv(downloadDir);
    const uploadPath = path.join(downloadDir, `fintech_questions_invalid_${suffix}.csv`);
    fs.writeFileSync(uploadPath, buildInvalidQuestionsCsv(fs.readFileSync(templatePath, 'utf-8'), suffix));

    try {
      await fintechPage.uploadQuestionsCsv(uploadPath);
      await fintechPage.assertImportReportedErrors(1, 1);

      // The report names the offending row and the value it choked on.
      const report = fintechPage.importErrorTable();
      await expect(report).toBeVisible();
      await expect(report).toContainText('Row 2');
      await expect(report).toContainText('NotARealCoE');

      // Nothing from a failed import may reach the question bank.
      await page.goto(`/fintech_questions?show_inactive=true&search=${suffix}`);
      await fintechPage.assertListLoaded();
      await expect(fintechPage.rows()).toHaveCount(0);
    } finally {
      await fintechPage.deleteAllQuestionsMatching(suffix);
      fs.rmSync(uploadPath, { force: true });
    }
  });

  test('the upload form refuses to submit without a file', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/import');
    await fintechPage.assertImportPageLoaded();

    await page.getByRole('button', { name: 'Upload & Import Questions' }).click();

    // The file input is required, so the browser must keep us on the form.
    await expect(page).toHaveURL(/\/fintech_questions\/import/i);
    expect(await page.$$eval('input#file:invalid', (els) => els.length)).toBe(1);
  });
});
