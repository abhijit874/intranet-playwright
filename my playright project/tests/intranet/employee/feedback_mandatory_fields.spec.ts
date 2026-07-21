import { test } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('mandatory fields - feedback must not be added without required data', async ({ page }) => {
  test.setTimeout(90000);
  const employeePage = new EmployeeListPage(page);
  const profilePage = new EmployeeProfilePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  const employeeName = await employeePage.getFirstEmployeeName();
  await employeePage.searchEmployee(employeeName);
  await employeePage.clickEmployeeProfileIcon();
  await profilePage.clickProfileTab('Feedbacks');
  // Open the feedback form but submit without filling any required fields
  await profilePage.openFeedbackForm();
  await profilePage.saveFeedback();
  // If feedback is added successfully, validation was bypassed — fail the test
  await profilePage.assertFeedbackNotAdded();
});
