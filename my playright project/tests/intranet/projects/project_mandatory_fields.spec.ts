import { test } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

test('mandatory fields - project must not be created without required data', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  // hr can reach the New Project form (admin has no "Add Project" button).
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();
  await projectsPage.clickNewProject();
  // Submit without filling any required fields
  await projectsPage.submitNewProject();
  // If the project is created successfully, validation was bypassed — fail the test
  await projectsPage.assertNotCreated();
});
