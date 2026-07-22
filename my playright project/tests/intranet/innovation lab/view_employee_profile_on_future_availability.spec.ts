import { test } from '@playwright/test';
import { FutureAvailabilityPage } from '../pages/FutureAvailabilityPage';

test('view employee profile on Future Availability', async ({ page }) => {
  const futureAvailabilityPage = new FutureAvailabilityPage(page);
  await futureAvailabilityPage.loginAs('admin');
  await futureAvailabilityPage.navigateTo();
  await futureAvailabilityPage.navigateToFutureAvailability();
  // Act on whoever is actually in the Future Availability rather than a hardcoded person.
  const { employee: employeeName } = await futureAvailabilityPage.getFirstFutureAvailabilityEntry();
  await futureAvailabilityPage.searchEmployee(employeeName);
  await futureAvailabilityPage.clickEmployeeProfileLink(employeeName);
  await futureAvailabilityPage.assertProfilePageOpened(employeeName);
});
