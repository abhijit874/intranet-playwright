import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';
import { FuturePoolPage } from '../pages/FuturePoolPage';

const knownEmployee = 'Abhijit Kasbe';  // change before running
const unknownName   = 'zzz_no_such_person_xyz';

test.describe('Pool report - search and filter', () => {

  test('current pool: search for unknown name shows no records', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployeeExpectNoResults(unknownName);
  });

  test('current pool: search for valid employee name filters to matching rows', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(knownEmployee);
    await poolPage.assertTableHasRecords();
  });

  test('current pool: clearing search after filter restores all records', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(knownEmployee);
    await poolPage.assertTableHasRecords();
    await poolPage.clearSearch();
    await poolPage.assertTableHasRecords();
  });

  test('future pool: search for unknown name shows no records', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('admin');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await futurePoolPage.searchEmployeeExpectNoResults(unknownName);
  });

  test('future pool: search for valid employee name filters to matching rows', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('admin');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await futurePoolPage.searchEmployee(knownEmployee);
    await futurePoolPage.assertTableHasRecords();
  });

  test('future pool: clearing search after filter restores all records', async ({ page }) => {
    const futurePoolPage = new FuturePoolPage(page);
    await futurePoolPage.loginAs('admin');
    await futurePoolPage.navigateTo();
    await futurePoolPage.navigateToFuturePool();
    await futurePoolPage.searchEmployee(knownEmployee);
    await futurePoolPage.assertTableHasRecords();
    await futurePoolPage.clearSearch();
    await futurePoolPage.assertTableHasRecords();
  });

});
