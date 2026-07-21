import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';

// "View Past Projects" is offered only on the Innovation Lab tab.
test('view past project', async ({ page }) => {
  const innovationLabPage = new InnovationLabPage(page);
  await innovationLabPage.loginAs('admin');
  await innovationLabPage.navigateTo();
  // Act on whoever is actually listed rather than a hardcoded person.
  const { employee, project } = await innovationLabPage.getFirstInnovationLabEntry({
    withPastProjectsLink: true,
  });
  await innovationLabPage.searchEmployee(employee, project);
  await innovationLabPage.clickViewPastProjects(employee);
  await innovationLabPage.assertPastProjectsPageOpened();
});
