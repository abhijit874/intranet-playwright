import { Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { gradeNumber, loadEmployeeCsv } from './employee_csv_helpers';

// L&D records must be raised against an employee graded J7–J11, but the employee
// picker only shows "email (id)" (no grade). The Employees CSV export carries
// both, so the grade-eligible Emp IDs come from there.
export const MIN_LD_GRADE = 7;
export const MAX_LD_GRADE = 11;

// Signs in as hr and returns the Emp IDs of employees graded J7–J11. Call this
// before opening the L&D form, then pass the result to
// LdRecordPage.selectLdEmployeeByIds().
export async function loginAndGetLdEligibleEmployeeIds(page: Page): Promise<string[]> {
  const eligibleIds = (rows: Awaited<ReturnType<typeof loadEmployeeCsv>>) =>
    rows
      .filter((r) => {
        const n = gradeNumber(r.grade);
        return n !== null && n >= MIN_LD_GRADE && n <= MAX_LD_GRADE;
      })
      .map((r) => r.empId);

  let ids = eligibleIds(await loadEmployeeCsv(page));
  if (!ids.length) {
    // The reused CSV yielded nobody eligible — download a fresh copy once.
    ids = eligibleIds(await loadEmployeeCsv(page, { refresh: true }));
  }
  if (!ids.length) {
    throw new Error(`No employees found with a grade between J${MIN_LD_GRADE} and J${MAX_LD_GRADE}.`);
  }

  // loadEmployeeCsv signs in as hr only on a cache miss, so establish a fresh
  // hr session either way before the L&D flow starts.
  await page.context().clearCookies();
  await login(page, 'hr');
  return ids;
}
