import { test } from '@playwright/test';
import { LdRecordPage } from '../pages/activities/LdRecordPage';
import { loginAndGetLdEligibleEmployeeIds } from './ld_helpers';
import { previousQuarterDateValue, validCurrentQuarterDate } from '../utils/test_helpers';

test('openverse tech content creator', async ({ page }) => {
  const title = `openverse-tech-${Date.now()}`; // unique per run, avoids collisions

  const ldPage = new LdRecordPage(page);
  const empIds = await loginAndGetLdEligibleEmployeeIds(page); // grade J7–J11 only
  await ldPage.navigateToCreateLdRecord();
  await ldPage.selectLdCategory('10');
  await ldPage.selectLdSubcategory('37');
  await ldPage.pressEscape();
  await ldPage.fillLdTitle(title);
  await ldPage.fillLdDate(validCurrentQuarterDate());
  await ldPage.assertLdDateRange();
  await ldPage.selectLdEmployeeByIds(empIds);
  await ldPage.fillLdDescription('playwright automation with claude');
  await ldPage.submitAndAssertSaved();
});

// SERVER-SIDE validation check.
// forceLdDate() sets the date via JS, bypassing the browser's client-side
// validation (the same way a malicious user or direct API call would). The
// backend MUST still reject a future date. submitAndAssertRejected() inspects the
// create POST's response: a 3xx redirect means a record was actually created, so
// the test fails — that failure is the bug being tracked.
const FUTURE_DATE = '2026-12-11'; // a future date the app must reject

test('openverse tech content creator — future date is rejected by the server', async ({ page }) => {
  const title = `openverse-tech-future-${Date.now()}`; // unique per run, avoids collisions

  const ldPage = new LdRecordPage(page);
  const empIds = await loginAndGetLdEligibleEmployeeIds(page); // grade J7–J11 only
  await ldPage.navigateToCreateLdRecord();
  await ldPage.selectLdCategory('10');
  await ldPage.selectLdSubcategory('37');
  await ldPage.pressEscape();
  await ldPage.fillLdTitle(title);
  await ldPage.forceLdDate(FUTURE_DATE); // bypasses client-side validation
  await ldPage.selectLdEmployeeByIds(empIds);
  await ldPage.fillLdDescription('playwright automation with claude');
  await ldPage.submitAndAssertRejected('future Activity Date');
});

// SERVER-SIDE validation check (previous-quarter date).
// The Activity Date input blocks dates before the current quarter with `min`, but
// forceLdDate() bypasses that. The backend MUST still reject a date from a
// previous quarter. submitAndAssertRejected() fails if the create POST returns a
// 3xx redirect — i.e. a record was actually created with an out-of-range date.
const PREVIOUS_QUARTER_DATE = previousQuarterDateValue(); // last day of the prior quarter

test('openverse tech content creator — previous-quarter date is rejected by the server', async ({ page }) => {
  const title = `openverse-tech-prevq-${Date.now()}`; // unique per run, avoids collisions

  const ldPage = new LdRecordPage(page);
  const empIds = await loginAndGetLdEligibleEmployeeIds(page); // grade J7–J11 only
  await ldPage.navigateToCreateLdRecord();
  await ldPage.selectLdCategory('10');
  await ldPage.selectLdSubcategory('37');
  await ldPage.pressEscape();
  await ldPage.fillLdTitle(title);
  await ldPage.forceLdDate(PREVIOUS_QUARTER_DATE); // bypasses client-side validation
  await ldPage.selectLdEmployeeByIds(empIds);
  await ldPage.fillLdDescription('playwright automation with claude');
  await ldPage.submitAndAssertRejected('previous-quarter Activity Date');
});
