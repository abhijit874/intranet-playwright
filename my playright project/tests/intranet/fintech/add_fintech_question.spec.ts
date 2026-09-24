import { test, expect } from '@playwright/test';
import { FinTechQuestionsPage } from '../pages/FinTechQuestionsPage';
import { createQuestion, deleteQuestion } from './fintech_helpers';

// Add / edit / delete for the FinTech question bank.
//
// Every test is self-contained: it creates the question it works on and removes
// it again, so nothing depends on a pre-seeded record and the staging bank is
// left exactly as it was found. Questions are created inactive so a throwaway
// record never reaches a real employee's daily assignment.
test.describe('FinTech Questions - add, edit and delete', () => {

  test('add a new FinTech question', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const created = await createQuestion(fintechPage);

    try {
      const row = await fintechPage.findQuestionRow(created.suffix);
      const cells = (await row.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      expect(cells[1]).toBe(created.coe);
      expect(cells[2]).toBe(created.level);
      expect(cells[3]).toContain(created.suffix);
      expect(cells[8]).toBe(created.correctOption);
    } finally {
      await deleteQuestion(fintechPage, created.suffix);
    }
  });

  test('a saved question keeps every value that was entered', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const created = await createQuestion(fintechPage, {
      coe: 'Core Banking',
      level: 'Hard',
      correctOption: 'C',
    });

    try {
      await fintechPage.openEditForQuestion(created.suffix);

      await expect(page.locator('#fintech_question_coe')).toHaveValue('Core Banking');
      await expect(page.locator('#fintech_question_level')).toHaveValue('Hard');
      await expect(page.locator('#fintech_question_question')).toHaveValue(created.question);
      await expect(page.locator('#fintech_question_option_a')).toHaveValue(`Option A ${created.suffix}`);
      await expect(page.locator('#fintech_question_option_b')).toHaveValue(`Option B ${created.suffix}`);
      await expect(page.locator('#fintech_question_option_c')).toHaveValue(`Option C ${created.suffix}`);
      await expect(page.locator('#fintech_question_option_d')).toHaveValue(`Option D ${created.suffix}`);
      await expect(page.locator('#fintech_question_correct_option')).toHaveValue('C');
      await expect(page.locator('#fintech_question_explanation')).toHaveValue(
        `Explanation added by automated test run ${created.suffix}.`
      );
      await expect(page.locator('#fintech_question_active')).not.toBeChecked();
    } finally {
      await deleteQuestion(fintechPage, created.suffix);
    }
  });

  test('a question saved without the optional fields is still accepted', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const suffix = Date.now().toString().slice(-6);
    await fintechPage.openAddQuestion();
    await fintechPage.selectCoE('Trading');
    await fintechPage.selectLevel('Easy');
    await fintechPage.fillQuestion(`Automation minimal question ${suffix}?`);
    await fintechPage.fillOptions(`Option A ${suffix}`, `Option B ${suffix}`);
    await fintechPage.selectCorrectOption('A');
    await fintechPage.setActive(false);
    await fintechPage.submit();
    await fintechPage.assertCreated();

    try {
      await expect(await fintechPage.findQuestionRow(suffix)).toBeVisible();
    } finally {
      await deleteQuestion(fintechPage, suffix);
    }
  });

  test('an inactive question is hidden from the active list and shown by "Show All"', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const created = await createQuestion(fintechPage);

    try {
      // Created inactive, so the default (active-only) list must not show it.
      await page.goto(`/fintech_questions?show_inactive=false&search=${created.suffix}`);
      await fintechPage.assertListLoaded();
      await expect(fintechPage.rows()).toHaveCount(0);

      // Showing all reveals it.
      await expect(await fintechPage.findQuestionRow(created.suffix)).toBeVisible();
    } finally {
      await deleteQuestion(fintechPage, created.suffix);
    }
  });

  test('edit an existing FinTech question', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    // Create the question this test will edit.
    const created = await createQuestion(fintechPage, { coe: 'Payment', level: 'Easy', correctOption: 'A' });

    try {
      await fintechPage.openEditForQuestion(created.suffix);
      await expect(page.getByRole('heading', { name: /Edit FinTech Question #\d+/ })).toBeVisible();

      await fintechPage.selectCoE('Lending');
      await fintechPage.selectLevel('Hard');
      await fintechPage.fillOptions(`Edited option A ${created.suffix}`, `Edited option B ${created.suffix}`);
      await fintechPage.selectCorrectOption('D');
      await fintechPage.fillExplanation(`Explanation edited by automated test run ${created.suffix}.`);
      await fintechPage.submit();
      await fintechPage.assertUpdated();

      const row = await fintechPage.findQuestionRow(created.suffix);
      const cells = (await row.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      expect(cells[1]).toBe('Lending');
      expect(cells[2]).toBe('Hard');
      expect(cells[4]).toContain(`Edited option A ${created.suffix}`);
      expect(cells[8]).toBe('D');
    } finally {
      await deleteQuestion(fintechPage, created.suffix);
    }
  });

  test('clearing a required field blocks the update', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const created = await createQuestion(fintechPage);

    try {
      await fintechPage.openEditForQuestion(created.suffix);
      const editUrl = page.url();

      await page.locator('#fintech_question_question').fill('');
      await fintechPage.submit();

      // The browser must keep us on the edit form rather than saving a blank question.
      await expect(page).toHaveURL(editUrl);
      expect(await fintechPage.invalidFieldIds()).toContain('fintech_question_question');
    } finally {
      await deleteQuestion(fintechPage, created.suffix);
    }
  });

  test('delete a FinTech question', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const created = await createQuestion(fintechPage);

    await fintechPage.openEditForQuestion(created.suffix);
    await fintechPage.deleteCurrentQuestion();

    await fintechPage.assertQuestionAbsent(created.suffix);
  });

  test('dismissing the delete confirmation keeps the question', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();

    const created = await createQuestion(fintechPage);

    try {
      await fintechPage.openEditForQuestion(created.suffix);

      // Turbo asks for confirmation before deleting; saying no must be a no-op.
      page.once('dialog', (dialog) => dialog.dismiss());
      await page.getByRole('link', { name: 'Delete Question' }).click();
      await page.waitForTimeout(2000);

      await expect(await fintechPage.findQuestionRow(created.suffix)).toBeVisible();
    } finally {
      await deleteQuestion(fintechPage, created.suffix);
    }
  });
});
