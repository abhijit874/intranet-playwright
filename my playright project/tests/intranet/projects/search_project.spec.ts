import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';
import { createProject } from './projects_helpers';

// Self-contained: creates a project, then searches for that exact project by name
// and confirms the row appears.
test('search project by name', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();

  const { name } = await createProject(projectsPage);

  await projectsPage.navigateTo();
  await projectsPage.search(name);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
