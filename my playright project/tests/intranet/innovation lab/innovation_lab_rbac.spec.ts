import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';
import { FutureAvailabilityPage } from '../pages/FutureAvailabilityPage';

test.describe('Innovation Lab - role-based access control', () => {

  // --- Authorized roles: read-only access ---

  test('leader can view Innovation Lab report but has no edit or remove icons', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('leader');
    await innovationLabPage.navigateTo();
    await innovationLabPage.assertInnovationLabLoaded();
    await innovationLabPage.assertEditIconNotVisible();
    await innovationLabPage.assertRemoveIconNotVisible();
  });

  test('leader can view Future Availability report but has no add-to-Innovation-Lab icons', async ({ page }) => {
    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.loginAs('leader');
    await futureAvailabilityPage.navigateTo();
    await futureAvailabilityPage.navigateToFutureAvailability();
    await futureAvailabilityPage.assertInnovationLabLoaded();
    await futureAvailabilityPage.assertAddToInnovationLabIconNotVisible();
  });

  // --- Unauthorized roles: Innovation Lab should not appear in navigation ---

  test('employee role does not have Innovation Lab in navigation', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('employee');
    await innovationLabPage.assertInnovationLabMenuItemNotVisible();
  });

  // The "sales" test account currently carries the leader role, so it gets the
  // same view-only access rather than being denied. If it is ever given a plain
  // sales role, this expectation flips to assertInnovationLabMenuItemNotVisible().
  test('sales account (leader role) has view-only Innovation Lab access', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('sales');
    await innovationLabPage.navigateTo();
    await innovationLabPage.assertInnovationLabLoaded();
    await innovationLabPage.assertEditIconNotVisible();
    await innovationLabPage.assertRemoveIconNotVisible();
  });

});
