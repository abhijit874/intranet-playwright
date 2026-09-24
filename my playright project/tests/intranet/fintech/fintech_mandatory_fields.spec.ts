import { test, expect } from '@playwright/test';
import { FinTechQuestionsPage } from '../pages/FinTechQuestionsPage';

test.describe('FinTech Questions - mandatory fields', () => {

  test('a question must not be created with an empty form', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    await fintechPage.submit();

    // If validation were bypassed the browser would have left the form.
    await fintechPage.assertNotCreated();
  });

  test('CoE, question text, both required options and the correct option are enforced', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    await fintechPage.submit();

    const invalid = await fintechPage.invalidFieldIds();
    for (const id of [
      'fintech_question_coe',
      'fintech_question_question',
      'fintech_question_option_a',
      'fintech_question_option_b',
      'fintech_question_correct_option',
    ]) {
      expect(invalid, `${id} was not reported as a required field`).toContain(id);
    }
  });

  test('the required fields are marked with an asterisk', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    for (const label of [
      'Center of Excellence (CoE) *',
      'Difficulty Level *',
      'Question Text *',
      'Option A *',
      'Option B *',
      'Correct Option *',
    ]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('a question is rejected when only the optional fields are filled', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    await fintechPage.fillExplanation('Explanation without a question behind it.');
    await page.locator('#fintech_question_option_c').fill('Orphan option C');
    await page.locator('#fintech_question_option_d').fill('Orphan option D');
    await fintechPage.submit();

    await fintechPage.assertNotCreated();
  });
});
