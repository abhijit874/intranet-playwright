import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('create new feedback record for other employee', async ({ page }) => {
  test.setTimeout(90000);
  const employeePage = new EmployeeListPage(page);
  const profilePage = new EmployeeProfilePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await profilePage.clickProfileTab('Feedbacks');
  await profilePage.addFeedback({
    type: 'Client Interview',
    project: 'BCSG',
    interviewer: 'Sameer tilak',
    date: '2025-12-08',
    status: 'Interview Select',
    comment: 'Test',
  });
  const alert = page.locator('#flashes');
  await expect(alert).toBeVisible();
  await expect(alert).toHaveClass(/alert-success/);
  await expect(alert).toContainText('Feedback added Successfully');
});
