import { test } from '@playwright/test';
import * as path from 'path';
import { ProjectsPage } from '../pages/ProjectsPage';

test('download project data flow - till projects click', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();
  await projectsPage.clickDownloadIcon();

  const downloadDir = path.resolve(__dirname, '../downloads');
  await projectsPage.downloadProjectsReport(downloadDir);
});
