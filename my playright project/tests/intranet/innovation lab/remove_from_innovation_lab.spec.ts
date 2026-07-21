import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';

test('remove from Innovation Lab', async ({ page }) => {
  const innovationLabPage = new InnovationLabPage(page);
  await innovationLabPage.loginAs('admin');
  await innovationLabPage.navigateTo();
  // Act on whoever is actually in the Innovation Lab rather than a hardcoded person, and
  // only on a row that still offers the remove action.
  const { employee: employeeName, project: projectName } = await innovationLabPage.getFirstInnovationLabEntry({
    withActions: true,
  });
  await innovationLabPage.searchEmployee(employeeName, projectName);
  await innovationLabPage.clickRemoveFromInnovationLab(employeeName, projectName);
  await innovationLabPage.confirmRemoveFromInnovationLab();
  await innovationLabPage.assertRemovedFromInnovationLab();
});
