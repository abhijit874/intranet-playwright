import { test, expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

test('view other employee feedback records', async ({ page }) => {
  test.setTimeout(60000);
  const employeePage = new EmployeePage(page);
  await employeePage.loginAs('hr');
  await employeePage.navigateToEmployees();
  await employeePage.switchToCompactView();
  await employeePage.searchEmployee('abhijit kasbe');
  await employeePage.clickEmployeeProfileIcon();
  await employeePage.clickProfileTab('Feedbacks');
  await expect(page.getByRole('tab', { name: 'Feedbacks' })).toHaveAttribute('aria-selected', 'true');
});
