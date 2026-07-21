import { test } from '@playwright/test';
import { FutureAvailabilityPage } from '../pages/FutureAvailabilityPage';

test('add to Innovation Lab', async ({ page }) => {
  const futureAvailabilityPage = new FutureAvailabilityPage(page);
  await futureAvailabilityPage.loginAs('admin');
  await futureAvailabilityPage.navigateTo();
  await futureAvailabilityPage.navigateToFutureAvailability();
  // Act on whoever is actually in the Future Availability rather than a hardcoded person.
  // Employees already in the Innovation Lab have no add icon, so require one.
  const { employee: employeeName, project: projectName } =
    await futureAvailabilityPage.getFirstFutureAvailabilityEntry({ withAddIcon: true });
  await futureAvailabilityPage.searchEmployee(employeeName, projectName);
  await futureAvailabilityPage.clickAddToInnovationLab(employeeName, projectName);
  await futureAvailabilityPage.confirmAddToInnovationLab();
  await futureAvailabilityPage.assertAddedToInnovationLab();
});
