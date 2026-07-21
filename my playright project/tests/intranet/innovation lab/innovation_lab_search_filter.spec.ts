import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';
import { FutureAvailabilityPage } from '../pages/FutureAvailabilityPage';

// The employee searched for is read from the table itself, so the suite never
// depends on a specific person still being in the Innovation Lab.
const unknownName = 'zzz_no_such_person_xyz';

test.describe('Innovation Lab - search and filter', () => {

  test('Innovation Lab: search for unknown name shows no records', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await innovationLabPage.navigateTo();
    await innovationLabPage.searchEmployeeExpectNoResults(unknownName);
  });

  test('Innovation Lab: search for valid employee name filters to matching rows', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await innovationLabPage.navigateTo();
    const { employee } = await innovationLabPage.getFirstInnovationLabEntry();
    await innovationLabPage.searchEmployee(employee);
    await innovationLabPage.assertTableHasRecords();
  });

  test('Innovation Lab: clearing search after filter restores all records', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await innovationLabPage.navigateTo();
    const { employee } = await innovationLabPage.getFirstInnovationLabEntry();
    await innovationLabPage.searchEmployee(employee);
    await innovationLabPage.assertTableHasRecords();
    await innovationLabPage.clearSearch();
    await innovationLabPage.assertTableHasRecords();
  });

  test('Future Availability: search for unknown name shows no records', async ({ page }) => {
    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.loginAs('admin');
    await futureAvailabilityPage.navigateTo();
    await futureAvailabilityPage.navigateToFutureAvailability();
    await futureAvailabilityPage.searchEmployeeExpectNoResults(unknownName);
  });

  test('Future Availability: search for valid employee name filters to matching rows', async ({ page }) => {
    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.loginAs('admin');
    await futureAvailabilityPage.navigateTo();
    await futureAvailabilityPage.navigateToFutureAvailability();
    const { employee } = await futureAvailabilityPage.getFirstFutureAvailabilityEntry();
    await futureAvailabilityPage.searchEmployee(employee);
    await futureAvailabilityPage.assertTableHasRecords();
  });

  test('Future Availability: clearing search after filter restores all records', async ({ page }) => {
    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.loginAs('admin');
    await futureAvailabilityPage.navigateTo();
    await futureAvailabilityPage.navigateToFutureAvailability();
    const { employee } = await futureAvailabilityPage.getFirstFutureAvailabilityEntry();
    await futureAvailabilityPage.searchEmployee(employee);
    await futureAvailabilityPage.assertTableHasRecords();
    await futureAvailabilityPage.clearSearch();
    await futureAvailabilityPage.assertTableHasRecords();
  });

});
