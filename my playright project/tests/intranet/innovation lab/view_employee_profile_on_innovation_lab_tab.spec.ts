import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';

test('view employee profile on Innovation Lab tab', async ({ page }) => {
  const innovationLabPage = new InnovationLabPage(page);
  await innovationLabPage.loginAs('admin');
  await innovationLabPage.navigateTo();
  // Act on whoever is actually in the Innovation Lab rather than a hardcoded person.
  const { employee: employeeName, project: projectName } = await innovationLabPage.getFirstInnovationLabEntry();
  await innovationLabPage.searchEmployee(employeeName, projectName);
  await innovationLabPage.clickEmployeeProfileLink(employeeName);
  await innovationLabPage.assertProfilePageOpened(employeeName);
});
