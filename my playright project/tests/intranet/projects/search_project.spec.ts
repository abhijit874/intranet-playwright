import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

test('search project by name', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();
  await projectsPage.search('Cypress_automation');
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
