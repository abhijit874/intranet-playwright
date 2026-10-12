import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';
import { createProject } from './projects_helpers';

test('create new project', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();

  // createProject fills the full form with unique name/code and verifies creation.
  await createProject(projectsPage);
});

// Self-contained: creates a fresh project (project manager = Pooja Mane), then
// opens that exact project on edit, confirms the project manager, and saves.
// Edits an existing project rather than creating one each run: opens the first
// project in the list and re-saves it. Staging-only data.
test('update project flow on edit', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Run only on Chromium as requested.');

  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await expect(page).toHaveURL(/pg-stage-intranet/i);
  await projectsPage.navigateTo();

  await projectsPage.clickEditOnFirstRow();

  // An existing project already has a project manager assigned.
  await expect(page.locator('#select2-project_manager_ids-container')).not.toBeEmpty();
  // An active project rejects an end date before today, and the first existing
  // one may have aged out — push it to a clearly-future date before saving.
  await projectsPage.setEndDate('2027-12-31');
  await projectsPage.saveProjectEdit();
  await projectsPage.assertSaved();
});

// Self-contained: creates a fresh (active) project, then opens it and marks it
// inactive.
test('mark project as inactive', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Run only on Chromium as requested.');

  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await expect(page).toHaveURL(/pg-stage-intranet/i);
  await projectsPage.navigateTo();

  const { name } = await createProject(projectsPage);

  await projectsPage.navigateTo();
  await projectsPage.search(name);
  await projectsPage.clickEditOnRow(name);

  // Keep the end date on/after the SOW dates set at creation (Jun–Nov 2026);
  // the server rejects a project end date earlier than the SOW dates.
  await projectsPage.setEndDate('2026-12-31');
  await projectsPage.setProjectActiveStatus(false);
  await projectsPage.saveProjectEdit();
  await projectsPage.assertSaved();
});
