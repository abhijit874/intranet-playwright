import { Page } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';

// L&D records must be raised against an employee graded J7–J11, but the employee
// picker only shows "email (id)" (no grade). The Employees tab carries the Grade
// column, so grade-eligible Emp IDs are read from there and matched in the picker
// by id.
export const MIN_LD_GRADE = 7;
export const MAX_LD_GRADE = 11;

// Signs in as hr and returns the Emp IDs of employees graded J7–J11. Call this
// before opening the L&D form (it navigates to the Employees tab), then pass the
// result to LdRecordPage.selectLdEmployeeByIds().
export async function loginAndGetLdEligibleEmployeeIds(page: Page): Promise<string[]> {
  const employees = new EmployeeListPage(page);
  await employees.loginAs('hr');
  return employees.getEmployeeIdsWithGradeInRange(MIN_LD_GRADE, MAX_LD_GRADE);
}
