import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

test('update project flow - add project manager on edit', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Run only on Chromium as requested.');

  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await expect(page).toHaveURL(/pg-stage-intranet/i);

  await projectsPage.navigateTo();
  await projectsPage.search('playwright automation');
  await projectsPage.clickEditOnRow('playwright automation');

  await expect(page.locator('#select2-project_manager_ids-container')).toContainText('Pooja Mane');
  await projectsPage.selectProjectManager(
    'Sai Pradhan(sai@joshsoftware.com)',
    'Sai Pradhan'
  );
  await projectsPage.saveProjectEdit();
});
