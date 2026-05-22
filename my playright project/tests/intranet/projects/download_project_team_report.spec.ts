import { test } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

test('download project team report flow - till download icon click', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();
  await projectsPage.clickDownloadIcon();
  await projectsPage.downloadProjectTeamsReport();
});
