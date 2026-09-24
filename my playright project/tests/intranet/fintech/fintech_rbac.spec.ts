import { test, expect } from '@playwright/test';
import { FinTechQuestionsPage, NOT_AUTHORIZED_MESSAGE, FinTechUserKey } from '../pages/FinTechQuestionsPage';

// Access matrix for FinTech Questions:
//   ld    → full access (question bank, analytics, bulk upload)
//   admin → full access
//   employee / hr / leader / sales / finance / manager → no nav entry, and a
//   direct hit on the URL is redirected home with an authorization flash.
test.describe('FinTech Questions - access per role', () => {

  for (const role of ['ld', 'admin'] as const) {
    test(`${role}: FinTech Questions is in the navigation and opens`, async ({ page }) => {
      const fintechPage = new FinTechQuestionsPage(page);
      await fintechPage.loginAs(role);
      await expect(fintechPage.navLink()).toHaveCount(1);
      await fintechPage.navigateTo();
      await expect(fintechPage.rows().first()).toBeVisible();
    });
  }

  const deniedRoles: FinTechUserKey[] = ['employee', 'hr', 'leader', 'sales', 'finance', 'manager'];

  for (const role of deniedRoles) {
    test(`${role}: FinTech Questions is absent from the navigation`, async ({ page }) => {
      const fintechPage = new FinTechQuestionsPage(page);
      await fintechPage.loginAs(role);
      await expect(fintechPage.navLink()).toHaveCount(0);
    });

    test(`${role}: a direct visit to /fintech_questions is refused`, async ({ page }) => {
      const fintechPage = new FinTechQuestionsPage(page);
      await fintechPage.loginAs(role);
      await fintechPage.openListDirectly();

      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('#flashes')).toContainText(NOT_AUTHORIZED_MESSAGE);
      await expect(fintechPage.table()).toHaveCount(0);
    });
  }

  // The sub-routes must be guarded too, not just the list.
  for (const path of ['/fintech_questions/new', '/fintech_questions/analytics', '/fintech_questions/import']) {
    test(`employee: a direct visit to ${path} is refused`, async ({ page }) => {
      const fintechPage = new FinTechQuestionsPage(page);
      await fintechPage.loginAs('employee');
      await page.goto(path);

      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('#flashes')).toContainText(NOT_AUTHORIZED_MESSAGE);
    });
  }
});
