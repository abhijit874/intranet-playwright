import { test, expect } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';
import { FutureAvailabilityPage } from '../pages/FutureAvailabilityPage';

// Access matrix for Innovation Lab:
//   admin  → full access (edit / remove / add-to-Innovation-Lab visible)
//   hr     → full access (edit / remove / add-to-Innovation-Lab visible)
//   leader → read-only  (table visible, no action icons)
//   employee → no access (Innovation Lab not in navigation)
//   sales    → no access (Innovation Lab not in navigation)

test.describe('Innovation Lab - access verification per role', () => {

  // ─── admin ────────────────────────────────────────────────────────────────

  test('admin: Innovation Lab navigation item is visible', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await expect(page.locator('a[href="/pool_reports"]')).toBeVisible();
  });

  test('admin: Innovation Lab table loads successfully', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await innovationLabPage.navigateTo();
    await innovationLabPage.assertInnovationLabLoaded();
  });

  test('admin: edit and remove icons are visible in Innovation Lab table', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await innovationLabPage.navigateTo();
    await expect(page.locator('table tbody tr i.ri-edit-2-line').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table tbody tr i.ri-user-minus-fill').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin: add-to-Innovation-Lab icon is visible in Future Availability table', async ({ page }) => {
    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.loginAs('admin');
    await futureAvailabilityPage.navigateTo();
    await futureAvailabilityPage.navigateToFutureAvailability();
    await expect(page.locator('table tbody tr i.text-success.ri-user-add-fill').first()).toBeVisible({ timeout: 10000 });
  });

  // ─── hr ───────────────────────────────────────────────────────────────────

  test('hr: Innovation Lab navigation item is visible', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('hr');
    await expect(page.locator('a[href="/pool_reports"]')).toBeVisible();
  });

  test('hr: Innovation Lab table loads successfully', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('hr');
    await innovationLabPage.navigateTo();
    await innovationLabPage.assertInnovationLabLoaded();
  });

  test('hr: edit and remove icons are visible in Innovation Lab table', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('hr');
    await innovationLabPage.navigateTo();
    await expect(page.locator('table tbody tr i.ri-edit-2-line').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table tbody tr i.ri-user-minus-fill').first()).toBeVisible({ timeout: 10000 });
  });

  test('hr: add-to-Innovation-Lab icon is visible in Future Availability table', async ({ page }) => {
    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.loginAs('hr');
    await futureAvailabilityPage.navigateTo();
    await futureAvailabilityPage.navigateToFutureAvailability();
    await expect(page.locator('table tbody tr i.text-success.ri-user-add-fill').first()).toBeVisible({ timeout: 10000 });
  });

  // ─── leader ───────────────────────────────────────────────────────────────

  test('leader: Innovation Lab navigation item is visible', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('leader');
    await expect(page.locator('a[href="/pool_reports"]')).toBeVisible();
  });

  test('leader: Innovation Lab table loads successfully', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('leader');
    await innovationLabPage.navigateTo();
    await innovationLabPage.assertInnovationLabLoaded();
  });

  test('leader: edit and remove icons are NOT visible in Innovation Lab table', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('leader');
    await innovationLabPage.navigateTo();
    await innovationLabPage.assertInnovationLabLoaded();
    await expect(page.locator('table tbody tr i.ri-edit-2-line')).toHaveCount(0);
    await expect(page.locator('table tbody tr i.ri-user-minus-fill')).toHaveCount(0);
  });

  test('leader: add-to-Innovation-Lab icon is NOT visible in Future Availability table', async ({ page }) => {
    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.loginAs('leader');
    await futureAvailabilityPage.navigateTo();
    await futureAvailabilityPage.navigateToFutureAvailability();
    await futureAvailabilityPage.assertInnovationLabLoaded();
    await expect(page.locator('table tbody tr i.text-success.ri-user-add-fill')).toHaveCount(0);
  });

  test('leader: can open employee public profile from Innovation Lab tab', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('leader');
    await innovationLabPage.navigateTo();
    // Whoever is actually in the Innovation Lab, rather than a hardcoded person.
    const { employee } = await innovationLabPage.getFirstInnovationLabEntry();
    await innovationLabPage.searchEmployee(employee);
    await innovationLabPage.clickEmployeeProfileLink(employee);
    await innovationLabPage.assertProfilePageOpened(employee);
  });

  test('leader: can open employee public profile from Future Availability tab', async ({ page }) => {
    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.loginAs('leader');
    await futureAvailabilityPage.navigateTo();
    await futureAvailabilityPage.navigateToFutureAvailability();
    const { employee } = await futureAvailabilityPage.getFirstFutureAvailabilityEntry();
    await futureAvailabilityPage.searchEmployee(employee);
    await futureAvailabilityPage.clickEmployeeProfileLink(employee);
    await futureAvailabilityPage.assertProfilePageOpened(employee);
  });

  // "View Past Projects" is offered only on the Innovation Lab tab, not on
  // Future Availability.
  test('leader: can view past projects of an employee from the Innovation Lab tab', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('leader');
    await innovationLabPage.navigateTo();
    const { employee, project } = await innovationLabPage.getFirstInnovationLabEntry({
      withPastProjectsLink: true,
    });
    await innovationLabPage.searchEmployee(employee, project);
    await innovationLabPage.clickViewPastProjects(employee);
    await innovationLabPage.assertPastProjectsPageOpened();
  });

  // ─── employee ─────────────────────────────────────────────────────────────

  test('employee: Innovation Lab navigation item is NOT visible', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('employee');
    await expect(page.locator('a[href="/pool_reports"]')).toHaveCount(0);
  });

  // ─── sales ────────────────────────────────────────────────────────────────

  // The "sales" test account currently carries the leader role, so it sees the
  // tab with view-only access rather than being denied.
  test('sales: Innovation Lab navigation item is visible (account holds leader role)', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('sales');
    await expect(page.locator('a[href="/pool_reports"]')).toHaveCount(1);
  });

});
