import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { EmployeeProfilePage } from '../pages/EmployeeProfilePage';

test('view other employee feedback records', async ({ page }) => {
  test.setTimeout(60000);
  const employeePage = new EmployeeListPage(page);
  const profilePage = new EmployeeProfilePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await profilePage.clickProfileTab('Feedbacks');
  await expect(page.getByRole('tab', { name: 'Feedbacks' })).toHaveAttribute('aria-selected', 'true');
});
