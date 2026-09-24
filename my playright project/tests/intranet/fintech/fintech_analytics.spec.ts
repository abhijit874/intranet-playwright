import { test, expect } from '@playwright/test';
import { FinTechQuestionsPage } from '../pages/FinTechQuestionsPage';
import { pastDateValue, currentDateValue } from '../utils/test_helpers';

test.describe('FinTech Questions - analytics & reports', () => {

  test('analytics page opens from the question bank', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAnalytics();
    await fintechPage.assertAnalyticsLoaded();
  });

  test('the four summary tiles are present and carry values', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/analytics');
    await fintechPage.assertAnalyticsLoaded();

    for (const tile of ['Total Responses', 'Overall Accuracy', 'Active Participants', 'Top CoE Performance']) {
      await expect(page.getByText(tile, { exact: false }).first()).toBeVisible();
    }

    // Accuracy must read as a percentage rather than an empty placeholder.
    await expect(page.locator('body')).toContainText(/\d+(\.\d+)?%/);
  });

  test('the employee leaderboard lists real employees with consistent numbers', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/analytics');
    await fintechPage.assertAnalyticsLoaded();

    const table = fintechPage.leaderboardTable();
    await expect(table).toBeVisible();

    const rows = table.locator('tbody tr');
    const count = await rows.count();
    expect(count, 'leaderboard has no entries').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const cells = (await rows.nth(i).locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      const [, name, email, answered, correct] = cells;
      expect(name, `leaderboard row ${i + 1} has no employee name`).not.toBe('');
      expect(email, `leaderboard row ${i + 1} has an invalid email`).toMatch(/@joshsoftware\.com$/);
      // Correct answers can never exceed the number answered.
      expect(Number(correct)).toBeLessThanOrEqual(Number(answered));
    }
  });

  test('the daily participation log reports a rate for each day', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/analytics');
    await fintechPage.assertAnalyticsLoaded();

    const table = fintechPage.participationTable();
    await expect(table).toBeVisible();

    const rows = table.locator('tbody tr');
    const count = await rows.count();
    expect(count, 'participation log is empty').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const cells = (await rows.nth(i).locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      expect(cells[0], `participation row ${i + 1} has no date`).not.toBe('');
      expect(cells[3], `participation row ${i + 1} has no participation rate`).toMatch(/%/);
    }
  });

  test('the date range and CoE filters apply', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/analytics');
    await fintechPage.assertAnalyticsLoaded();

    await fintechPage.applyAnalyticsFilters({
      startDate: pastDateValue(30),
      endDate: currentDateValue(),
      coe: 'Payment',
    });

    await expect(page).toHaveURL(/coe=Payment/i);
    await expect(page.locator('#coe')).toHaveValue('Payment');
  });

  test('Reset Filters clears the applied filters', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/analytics');
    await fintechPage.assertAnalyticsLoaded();

    await fintechPage.applyAnalyticsFilters({ coe: 'Lending' });
    await page.getByRole('link', { name: 'Reset Filters' }).click();
    await fintechPage.assertAnalyticsLoaded();

    await expect(page.locator('#coe')).toHaveValue('');
  });

  test('the employee report exports as CSV', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/analytics');
    await fintechPage.assertAnalyticsLoaded();

    const href = await page.getByRole('link', { name: 'Export Employee Report' }).getAttribute('href');
    expect(href).toContain('/fintech_questions/export_analytics');
    expect(href).toContain('type=employee');

    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('csv');
    expect(await response.text()).not.toBe('');
  });

  test('the daily participation report exports as CSV', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/analytics');
    await fintechPage.assertAnalyticsLoaded();

    const href = await page.getByRole('link', { name: 'Download Participation CSV' }).getAttribute('href');
    expect(href).toContain('type=daily_participation');

    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('csv');
  });
});
