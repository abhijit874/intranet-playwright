import { test, expect } from '@playwright/test';
import { FinTechQuestionsPage } from '../pages/FinTechQuestionsPage';
import { deleteQuestion } from './fintech_helpers';
import { stripClientValidation, currentDateValue, pastDateValue } from '../utils/test_helpers';

/**
 * FinTech Questions — negative cases.
 *
 * The existing mandatory-fields spec proves the BROWSER refuses an incomplete
 * question: it reads back `:invalid` field ids and checks the form did not
 * navigate. That is worth having, but it says nothing about the server, and the
 * server is what a direct POST talks to. These tests strip the browser's
 * validation first, so what is being asserted is the app's own answer.
 *
 * They assert the exact error text rather than merely "not created", because a
 * form that failed to submit for an unrelated reason also fails to create
 * anything — the error message is what proves the request was understood and
 * refused on purpose.
 *
 * Questions created here would be throwaway records in a bank real employees are
 * served from, so every case is one the app rejects; nothing is left behind.
 */
test.describe('FinTech Questions - negative cases', () => {

  const ERRORS = '.invalid-feedback, .field_with_errors, .alert-danger, .error';

  test('an empty question is refused by the server, not just the browser', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    await stripClientValidation(page);
    await fintechPage.submit();

    // Every required field is named, so this also pins down WHICH fields the
    // server considers mandatory — the browser-level spec can only report which
    // ones carry the required attribute.
    const errors = page.locator(ERRORS).first();
    await expect(errors).toContainText(/Coe can't be blank/i);
    await expect(errors).toContainText(/Question can't be blank/i);
    await expect(errors).toContainText(/Option a can't be blank/i);
    await expect(errors).toContainText(/Option b can't be blank/i);
    await expect(errors).toContainText(/Correct option can't be blank/i);
    await fintechPage.assertNotCreated();
  });

  // Options C and D are optional, so a question can legitimately have only two
  // answers — which makes it possible to mark an answer correct that does not
  // exist. The app catches exactly that.
  test('the correct option cannot point at an option that was left blank', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    const suffix = Date.now().toString().slice(-6);
    await fintechPage.selectCoE('Payment');
    await fintechPage.selectLevel('Easy');
    await fintechPage.fillQuestion(`Negative check ${suffix} - correct option points at a blank option?`);
    await fintechPage.fillOptions(`Option A ${suffix}`, `Option B ${suffix}`);
    await fintechPage.selectCorrectOption('D'); // D was never filled in
    await fintechPage.setActive(false);

    await stripClientValidation(page);
    await fintechPage.submit();

    await expect(page.locator(ERRORS).first()).toContainText(
      /Correct option cannot be 'D' when Option D is blank/i
    );
    await fintechPage.assertNotCreated();
  });

  // The CoE and level dropdowns only offer valid values, so the only way to send
  // anything else is to tamper with the option list — which is precisely what a
  // direct POST does. The bulk CSV import already rejects an unknown CoE; this
  // asks whether the form path enforces the same list.
  test('a CoE outside the accepted list is rejected', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    const suffix = Date.now().toString().slice(-6);
    await fintechPage.selectLevel('Easy');
    await fintechPage.fillQuestion(`Negative check ${suffix} - unknown CoE?`);
    await fintechPage.fillOptions(`Option A ${suffix}`, `Option B ${suffix}`);
    await fintechPage.selectCorrectOption('A');
    await fintechPage.setActive(false);

    await stripClientValidation(page);
    await page.locator('#fintech_question_coe').evaluate((select) => {
      const option = document.createElement('option');
      option.value = 'NotARealCoE';
      option.text = 'NotARealCoE';
      (select as HTMLSelectElement).appendChild(option);
      (select as HTMLSelectElement).value = 'NotARealCoE';
    });
    await fintechPage.submit();

    await expect(page.locator(ERRORS).first()).toContainText(
      /Coe must be one of: Trading, Payment, Core Banking, Investment & Wealth Management, Lending/i
    );
    await fintechPage.assertNotCreated();
  });

  test('a correct option outside A-D is rejected', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    const suffix = Date.now().toString().slice(-6);
    await fintechPage.selectCoE('Payment');
    await fintechPage.selectLevel('Easy');
    await fintechPage.fillQuestion(`Negative check ${suffix} - correct option out of range?`);
    await fintechPage.fillOptions(`Option A ${suffix}`, `Option B ${suffix}`);
    await fintechPage.setActive(false);

    await stripClientValidation(page);
    await page.locator('#fintech_question_correct_option').evaluate((select) => {
      const option = document.createElement('option');
      option.value = 'Z';
      option.text = 'Z';
      (select as HTMLSelectElement).appendChild(option);
      (select as HTMLSelectElement).value = 'Z';
    });
    await fintechPage.submit();

    await expect(page.locator(ERRORS).first()).toContainText(
      /Correct option must be one of: A, B, C, D/i
    );
    await fintechPage.assertNotCreated();
  });

  // CONFIRMED DEFECT (2026-10-08, considered a defect with the user; no card by
  // request): a question saves with two options carrying identical text. Only
  // one option can ever be marked correct (the field is a single A/B/C/D value —
  // even a forced two-value submission is collapsed to one server-side), so a
  // duplicated option makes the question unanswerable: a candidate who picks the
  // other identical option is marked wrong for the same answer.
  //
  // This test actually creates a question while the defect is open, so it deletes
  // it before asserting — the cleanup must run whether or not the assertion later
  // fails. Marked test.fail(): it passes by failing now and will report
  // "unexpectedly passed" once duplicate option text is rejected.
  test.fail('a question with two identical option texts is rejected', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await fintechPage.navigateTo();
    await fintechPage.openAddQuestion();

    const suffix = Date.now().toString().slice(-6);
    await fintechPage.selectCoE('Payment');
    await fintechPage.selectLevel('Easy');
    await fintechPage.fillQuestion(`Duplicate-option check ${suffix}?`);
    // Options A and B are identical; C and D differ so only A/B collide.
    await fintechPage.fillOptions(
      `Same answer ${suffix}`,
      `Same answer ${suffix}`,
      `Other answer C ${suffix}`,
      `Other answer D ${suffix}`
    );
    await fintechPage.selectCorrectOption('A');
    await fintechPage.fillExplanation(`Duplicate-option check ${suffix}.`);
    await fintechPage.setActive(false);
    await fintechPage.submit();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Whether it was created, read before any assertion so cleanup can run first.
    const created = !/\/fintech_questions\/new/i.test(page.url());
    if (created) await deleteQuestion(fintechPage, suffix);

    expect(created, 'a question with two identical option texts was accepted').toBe(false);
  });

  // Analytics date range. Unlike every other date range in the app, this one
  // filters a report rather than saving a record, so a reversed range cannot
  // corrupt anything — but it can silently produce an empty report that looks
  // like "nobody participated" rather than "you asked for an impossible range".
  //
  // The app currently accepts the reversed range without comment. This test
  // records that it at least stays on its feet and keeps the filters it was
  // given, so a future change to either behaviour is visible.
  test('analytics survives a reversed date range', async ({ page }) => {
    const fintechPage = new FinTechQuestionsPage(page);
    await fintechPage.loginAs('ld');
    await page.goto('/fintech_questions/analytics');
    await fintechPage.assertAnalyticsLoaded();

    // Start today, end 30 days ago.
    const start = currentDateValue();
    const end = pastDateValue(30);
    await fintechPage.applyAnalyticsFilters({ startDate: start, endDate: end });

    await fintechPage.assertAnalyticsLoaded();
    await expect(page.locator('#start_date')).toHaveValue(start);
    await expect(page.locator('#end_date')).toHaveValue(end);
  });
});
