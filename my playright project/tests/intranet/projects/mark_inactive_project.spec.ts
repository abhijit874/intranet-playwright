import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

test('mark project as inactive', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Run only on Chromium as requested.');

  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await expect(page).toHaveURL(/pg-stage-intranet/i);

  await projectsPage.navigateTo();
  await projectsPage.search('Cypress_automation');
  await projectsPage.clickEditOnRow('Cypress_automation');

  await projectsPage.setEndDate('2026-05-18');
  await projectsPage.setProjectActiveStatus(false);
  await projectsPage.saveProjectEdit();
});
