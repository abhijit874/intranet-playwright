import { test, expect } from '@playwright/test';
import { login, UserKey } from '../utils/login_helper';
import { expectAccessDenied } from '../utils/rbac_helper';

/**
 * Global Constants access control.
 *
 * Global Constants is admin-only — it is the one navigation entry that HR does
 * not get either. Both the list and the New form are guarded.
 */
test.describe('Global Constants - access per role', () => {

  test('admin: the list opens with its expected columns', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/global_constants');
    await expect(page.getByRole('heading', { name: 'Global Constants' })).toBeVisible();
    await expect(page.locator('#sortable thead th'))
      .toContainText(['Name', 'Type', 'Data', 'Latest Modified', 'Action']);
    await expect(page.getByText('Add Global Constant')).toBeVisible();
  });

  test('admin: the New Global Constant form opens with its required fields', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/global_constants/new');
    await expect(page.getByRole('heading', { name: 'New Global Constant' })).toBeVisible();
    await expect(page.locator('#global_constant_name')).toBeVisible();
    await expect(page.locator('#global_constant_data_type')).toBeVisible();
    await expect(page.locator('#global_constant_data_structure')).toBeVisible();
    // "Add Data" is a nested-fields blueprint link: present in the DOM but
    // hidden until a Type/Structure is chosen, so assert on presence only.
    await expect(page.locator('a.add_nested_fields', { hasText: 'Add Data' })).toHaveCount(1);
  });

  const deniedRoles: UserKey[] = ['employee', 'hr', 'manager', 'finance', 'sales', 'leader', 'ld'];

  for (const role of deniedRoles) {
    test(`${role}: a direct visit to /global_constants is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/global_constants');
    });

    test(`${role}: a direct visit to /global_constants/new is refused`, async ({ page }) => {
      await login(page, role);
      await expectAccessDenied(page, '/global_constants/new');
    });
  }
});
