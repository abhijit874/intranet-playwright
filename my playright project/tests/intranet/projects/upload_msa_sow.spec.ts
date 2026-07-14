import { test } from '@playwright/test';
import * as path from 'path';
import { ProjectsPage } from '../pages/ProjectsPage';
import { createProject } from './projects_helpers';

// Self-contained: creates a fresh project as hr (only hr can create), then signs
// in as sales — the SOW/MSA upload UI is gated to the sales role — to open that
// project, set the SOW status to finalized and upload the SOW and MSA documents.
test('upload MSA and SOW documents for a project', async ({ page }) => {
  const fixturePath = path.resolve(__dirname, '../../fixtures/image.png');

  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();

  const { name } = await createProject(projectsPage);

  // Switch to the sales role for the SOW/MSA upload.
  await page.context().clearCookies();
  await projectsPage.loginAs('sales');
  await projectsPage.navigateTo();
  await projectsPage.search(name);
  await projectsPage.clickEditOnRow(name);
  await projectsPage.selectSowStatus('SOW Finalized');
  await projectsPage.uploadSowFile(fixturePath);
  await projectsPage.uploadMsaFile(fixturePath);
  await projectsPage.saveProjectEdit();
  await projectsPage.assertSaved();
});
