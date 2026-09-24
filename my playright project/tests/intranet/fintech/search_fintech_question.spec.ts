import { test, expect } from '@playwright/test';
import { FinTechQuestionsPage, COE_OPTIONS, LEVEL_OPTIONS } from '../pages/FinTechQuestionsPage';

// Search plus the CoE / level dropdowns — all three narrow the same table, so
// they are exercised together. The dropdowns submit the filter form on change.
test.describe('FinTech Questions - search and filters', () => {

  // Searches for a term taken from a question already in the bank, so the test
  // does not depend on any particular seeded record.
  test('searching by question text narrows the table to matching rows', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const firstQuestion = (await fintechPage.columnValues(4))[0];
    expect(firstQuestion, 'question bank is empty').toBeTruthy();

    // A distinctive word from the question, long enough not to match everything.
    const term = (firstQuestion.match(/\b[A-Za-z]{6,}\b/) || [])[0];
    expect(term, `no searchable word found in "${firstQuestion}"`).toBeTruthy();

    await fintechPage.search(term!);

    // Search spans the question text *and* the options, so the term is matched
    // against the whole row rather than the Question column alone.
    const rows = fintechPage.rows();
    const count = await rows.count();
    expect(count, `search for "${term}" returned nothing`).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const rowText = (await rows.nth(i).innerText()).replace(/\s+/g, ' ').toLowerCase();
      expect(rowText, `row ${i + 1} does not contain the search term`).toContain(term!.toLowerCase());
    }
  });

  test('search also matches option text', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const firstOptionA = (await fintechPage.columnValues(5))[0];
    const term = (firstOptionA.match(/\b[A-Za-z]{6,}\b/) || [])[0];
    expect(term, `no searchable word found in option "${firstOptionA}"`).toBeTruthy();

    await fintechPage.search(term!);

    const count = await fintechPage.rows().count();
    expect(count, `searching option text for "${term}" returned nothing`).toBeGreaterThan(0);
  });

  test('a search with no matches shows the empty-state message', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    await fintechPage.search('zzzznosuchquestionzzzz');

    await expect(fintechPage.rows()).toHaveCount(0);
    await expect(fintechPage.table().locator('tbody')).toContainText('No questions found');
  });

  for (const coe of COE_OPTIONS) {
    test(`filtering by CoE "${coe}" returns only that CoE`, async ({ page }) => {
      const fintechPage = new FinTechQuestionsPage(page);
      await fintechPage.loginAs('ld');
      await fintechPage.navigateTo();
      await fintechPage.filterByCoE(coe);

      const values = await fintechPage.columnValues(2);
      expect(values.length, `no questions listed for CoE "${coe}"`).toBeGreaterThan(0);
      expect([...new Set(values)]).toEqual([coe]);
    });
  }

  for (const level of LEVEL_OPTIONS) {
    test(`filtering by level "${level}" returns only that level`, async ({ page }) => {
      const fintechPage = new FinTechQuestionsPage(page);
      await fintechPage.loginAs('ld');
      await fintechPage.navigateTo();
      await fintechPage.filterByLevel(level);

      const values = await fintechPage.columnValues(3);
      expect(values.length, `no questions listed for level "${level}"`).toBeGreaterThan(0);
      expect([...new Set(values)]).toEqual([level]);
    });
  }

  test('CoE and level filters combine', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    await fintechPage.filterByCoE('Lending');
    await fintechPage.filterByLevel('Easy');

    const coes = await fintechPage.columnValues(2);
    const levels = await fintechPage.columnValues(3);
    expect(coes.length, 'no Lending/Easy questions listed').toBeGreaterThan(0);
    expect([...new Set(coes)]).toEqual(['Lending']);
    expect([...new Set(levels)]).toEqual(['Easy']);
  });

  test('"Clear" resets the filters and restores the full list', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    await fintechPage.filterByCoE('Trading');
    const filtered = await fintechPage.rows().count();

    await fintechPage.clearFilters();
    await expect(page.locator('#coe')).toHaveValue('');
    await expect(page.locator('#level')).toHaveValue('');

    const cleared = await fintechPage.columnValues(2);
    expect(cleared.length).toBeGreaterThan(0);
    // A cleared list must not be a single-CoE list any more, unless the filtered
    // set already filled the page on its own.
    expect(cleared.length >= filtered).toBe(true);
  });
});
