import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';
import { FutureAvailabilityPage } from '../pages/FutureAvailabilityPage';

test.describe('Innovation Lab - role-based access control', () => {

  // --- Authorized roles ---
  // Leader has edit access, like admin and hr. Add-to and remove-from Innovation
  // Lab were taken out of the product for every role.

  test('leader can view and edit the Innovation Lab report, with no remove icons', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('leader');
    await innovationLabPage.navigateTo();
    await innovationLabPage.assertInnovationLabLoaded();
    await innovationLabPage.assertEditIconVisible();
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

  // The "sales" test account carries the leader role, so it gets the same access
  // as leader, edit included. If it is ever given a plain sales role, this
  // expectation flips to assertInnovationLabMenuItemNotVisible().
  test('sales account (leader role) can view and edit Innovation Lab', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('sales');
    await innovationLabPage.navigateTo();
    await innovationLabPage.assertInnovationLabLoaded();
    await innovationLabPage.assertEditIconVisible();
    await innovationLabPage.assertRemoveIconNotVisible();
  });

});
