import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';
import { futureDateValue } from '../utils/test_helpers';

test('update Innovation Lab details', async ({ page }) => {
  const innovationLabPage = new InnovationLabPage(page);
  await innovationLabPage.loginAs('admin');
  await innovationLabPage.navigateTo();
  // Act on whoever is actually in the Innovation Lab rather than a hardcoded person, and
  // only on a row that exposes the edit action.
  const { employee: employeeName, project: projectName } = await innovationLabPage.getFirstInnovationLabEntry({
    withActions: true,
  });
  await innovationLabPage.searchEmployee(employeeName, projectName);
  await innovationLabPage.clickEditIcon(employeeName, projectName);

  // Dates are always ahead of today, so the spec never goes stale.
  await innovationLabPage.fillOeta(futureDateValue(15));
  await innovationLabPage.fillNeta(futureDateValue(30));
  await innovationLabPage.selectRandomProposedProject();
  await innovationLabPage.fillTrainingPlan('playwright automation');
  await innovationLabPage.fillInterviewRejected('this is test');
  await innovationLabPage.fillComments('this is test');
  await innovationLabPage.submitUpdate();
  await innovationLabPage.assertInnovationLabDetailsUpdated();
});
