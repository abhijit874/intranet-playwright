import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Projects access control.
 *
 * The list is broadly readable — every role except a plain employee has a
 * Projects entry — but creating is narrower than the list suggests: the
 * "Add Project" link is rendered for hr and not for admin. That split is
 * long-standing (project_mandatory_fields.spec.ts has noted it since it was
 * written) and easy to break silently, since nothing else asserts it.
 */
test.describe('Projects - access per role', () => {

  const listRoles: UserKey[] = ['admin', 'hr', 'manager', 'finance', 'sales', 'leader', 'ld'];

  for (const role of listRoles) {
    test(`${role}: the projects list opens`, async ({ page }) => {
      await login(page, role);
      await page.goto('/projects');
      await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    });
  }

  test('employee: a direct visit to /projects is refused', async ({ page }) => {
    await login(page, 'employee');
    await expectAccessDenied(page, '/projects');
  });

  test('employee: the Projects navigation entry is absent', async ({ page }) => {
    await login(page, 'employee');
    await expect(page.locator('a[href="/projects"]')).toHaveCount(0);
  });

  test('hr: the Add Project link is offered', async ({ page }) => {
    await login(page, 'hr');
    await page.goto('/projects');
    await expect(page.locator('a[href="/projects/new"]').first()).toBeVisible();
  });

  test('admin: no Add Project link - creating is an HR job', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.locator('a[href="/projects/new"]')).toHaveCount(0);
  });

  test('employee: a direct visit to /projects/new is refused', async ({ page }) => {
    await login(page, 'employee');
    await expectAccessDenied(page, '/projects/new');
  });
});
