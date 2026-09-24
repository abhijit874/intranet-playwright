import { test, expect } from '@playwright/test';
import { FinTechQuestionsPage } from '../pages/FinTechQuestionsPage';

// Read-only checks on the question bank as the L&D account.
test.describe('FinTech Questions - list page', () => {

  test('L&D can reach FinTech Questions from the navigation', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await expect(fintechPage.navLink()).toBeVisible();
    await fintechPage.navigateTo();
    await expect(page).toHaveURL(/\/fintech_questions/i);
  });

  test('question table renders its expected columns', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.assertColumnHeaders();
  });

  test('question table lists rows with real data', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const rowCount = await fintechPage.rows().count();
    expect(rowCount, 'FinTech question bank is empty').toBeGreaterThan(0);

    // Every listed row must carry a CoE, a level, a question and a correct option
    // — a blank cell means the list is rendering placeholder rows.
    for (const [column, label] of [[2, 'CoE'], [3, 'Level'], [4, 'Question'], [9, 'Correct']] as const) {
      const values = await fintechPage.columnValues(column);
      expect(values, `no ${label} values read from the table`).not.toHaveLength(0);
      expect(values.every((v) => v.length > 0), `blank ${label} cell in the question table`).toBe(true);
    }
  });

  test('every row exposes an edit action', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const rows = fintechPage.rows();
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('a[href$="/edit"] i.ri-edit-2-line')).toBeVisible();
    }
  });

  test('the list is paginated', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    await expect(page.locator('.pagination')).toBeVisible();
    await expect(fintechPage.rows()).toHaveCount(10);

    await page.locator('.pagination .page-link', { hasText: '2' }).first().click();
    await fintechPage.assertListLoaded();
    await expect(fintechPage.rows().first()).toBeVisible();
  });

  test('"Show All" reveals inactive questions and "Show Active" restores the default', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    await fintechPage.showAll();
    await expect(fintechPage.rows().first()).toBeVisible();

    await fintechPage.showActiveOnly();
    await expect(fintechPage.rows().first()).toBeVisible();
  });
});
