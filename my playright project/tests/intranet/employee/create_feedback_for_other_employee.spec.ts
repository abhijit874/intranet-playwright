import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('create new feedback record for other employee', async ({ page }) => {
  test.setTimeout(90000);
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await employeePage.clickProfileTab('Feedbacks');
  await employeePage.addFeedback({
    type: 'Client Interview',
    project: 'BCSG',
    interviewer: 'Sameer tilak',
    date: '2025-12-08',
    status: 'Interview Select',
    comment: 'Test',
  });
  await expect(page.locator('#flashes')).toBeVisible();
  await expect(page.locator('#flashes')).toContainText('Feedback added Successfully');
});
