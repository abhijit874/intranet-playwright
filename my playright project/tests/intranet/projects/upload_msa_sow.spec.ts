import { test } from '@playwright/test';
import * as path from 'path';
import { ProjectsPage } from '../pages/ProjectsPage';

test('upload MSA and SOW documents for a project', async ({ page }) => {
  const fixturePath = path.resolve(__dirname, '../../fixtures/image.png');
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('sales');
  await projectsPage.navigateTo();
  await projectsPage.search('Admin Module Rewrite');
  await projectsPage.clickEditOnRow('Admin Module Rewrite');
  await projectsPage.selectSowStatus('SOW Finalized');
  await projectsPage.uploadSowFile(fixturePath);
  await projectsPage.uploadMsaFile(fixturePath);
  await projectsPage.saveProjectEdit();
});
