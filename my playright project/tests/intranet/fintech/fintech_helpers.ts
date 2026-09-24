import { FinTechQuestionsPage, COE_OPTIONS, LEVEL_OPTIONS } from '../pages/FinTechQuestionsPage';

export type CreatedQuestion = {
  /** Unique per run — the search term every later step uses to find this row. */
  suffix: string;
  question: string;
  coe: string;
  level: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
};

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

/**
 * Fills and submits the Add Question form, then asserts the success flash.
 *
 * The question is created **inactive** on purpose: an active question enters the
 * daily assignment pool that real staging employees answer, and a throwaway test
 * record has no business showing up there. Inactive rows are still fully
 * editable and deletable, and the page object's `findQuestionRow` turns on
 * "show all" so the tests can still see them.
 */
export async function createQuestion(
  fintechPage: FinTechQuestionsPage,
  overrides: Partial<CreatedQuestion> = {}
): Promise<CreatedQuestion> {
  const suffix = overrides.suffix ?? Date.now().toString().slice(-6);
  const coe = overrides.coe ?? pick(COE_OPTIONS);
  const level = overrides.level ?? pick(LEVEL_OPTIONS);
  const correctOption = overrides.correctOption ?? 'B';
  const question =
    overrides.question ?? `Automation check ${suffix} — which statement about settlement is correct?`;

  await fintechPage.openAddQuestion();
  await fintechPage.selectCoE(coe);
  await fintechPage.selectLevel(level);
  await fintechPage.fillQuestion(question);
  await fintechPage.fillOptions(
    `Option A ${suffix}`,
    `Option B ${suffix}`,
    `Option C ${suffix}`,
    `Option D ${suffix}`
  );
  await fintechPage.selectCorrectOption(correctOption);
  await fintechPage.fillExplanation(`Explanation added by automated test run ${suffix}.`);
  await fintechPage.setActive(false);
  await fintechPage.submit();
  await fintechPage.assertCreated();

  return { suffix, question, coe, level, correctOption };
}

/**
 * Deletes a question created by `createQuestion`, so specs leave the staging
 * question bank exactly as they found it.
 */
export async function deleteQuestion(fintechPage: FinTechQuestionsPage, suffix: string) {
  await fintechPage.openEditForQuestion(suffix);
  await fintechPage.deleteCurrentQuestion();
  await fintechPage.assertQuestionAbsent(suffix);
}

/**
 * Appends question rows to a downloaded template so the upload test exercises
 * the very file the app handed out, rather than a hand-rolled CSV that only
 * looks like it.
 *
 * `Active` is written as `false` on every row on purpose: the import page
 * documents that a blank Active column defaults to **true**, which would push
 * throwaway questions into the daily assignment pool.
 */
export function appendQuestionRows(templateCsv: string, suffix: string, rowCount = 2): string {
  const header = templateCsv.split('\n')[0].trim();
  const samples = [
    {
      coe: 'Payment',
      level: 'Easy',
      question: `Bulk import ${suffix}-1 what does UPI stand for?`,
      options: ['Unified Payments Interface', 'Universal Payment Identifier', 'Unique Payment Instrument', 'Unified Processing Interface'],
      correct: 'A',
    },
    {
      coe: 'Lending',
      level: 'Hard',
      question: `Bulk import ${suffix}-2 what is a bullet repayment?`,
      options: ['Equal monthly instalments', 'Principal repaid in full at maturity', 'Interest waived entirely', 'A type of collateral'],
      correct: 'B',
    },
    {
      coe: 'Trading',
      level: 'Medium',
      question: `Bulk import ${suffix}-3 what does a limit order guarantee?`,
      options: ['Execution at any price', 'A price no worse than the limit', 'Immediate execution', 'Zero brokerage'],
      correct: 'B',
    },
  ];

  const rows = samples.slice(0, rowCount).map((s) =>
    [
      s.coe,
      s.level,
      `"${s.question}"`,
      ...s.options,
      s.correct,
      `"Imported by automated test run ${suffix}."`,
      'false',
    ].join(',')
  );

  return [header, ...rows].join('\n') + '\n';
}

/** A CSV whose single row carries a CoE the app does not accept. */
export function buildInvalidQuestionsCsv(templateCsv: string, suffix: string): string {
  const header = templateCsv.split('\n')[0].trim();
  const row = [
    'NotARealCoE',
    'Easy',
    `"Bulk import ${suffix}-invalid should be rejected?"`,
    'Option A', 'Option B', 'Option C', 'Option D',
    'A',
    `"Imported by automated test run ${suffix}."`,
    'false',
  ].join(',');
  return [header, row].join('\n') + '\n';
}
