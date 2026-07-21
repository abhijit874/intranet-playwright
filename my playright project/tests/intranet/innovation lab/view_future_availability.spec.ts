import { test } from '@playwright/test';
import { FutureAvailabilityPage } from '../pages/FutureAvailabilityPage';

test('view Future Availability report as leader', async ({ page }) => {
  const futureAvailabilityPage = new FutureAvailabilityPage(page);
  await futureAvailabilityPage.loginAs('leader');
  await futureAvailabilityPage.navigateTo();
  await futureAvailabilityPage.navigateToFutureAvailability();
  await futureAvailabilityPage.assertInnovationLabLoaded();
});
