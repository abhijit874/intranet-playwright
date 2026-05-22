import { test } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

test('deallocate team member flow - open projects page', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();
  await projectsPage.search('Annual Maintenance Contract');
  await projectsPage.clickEditOnRow('Annual Maintenance Contract');
  await projectsPage.openTeamDetailsTab();

  await projectsPage.clickEmployeeToggle('Shraddha Ghodke(shraddha.ghodke@joshsoftware.com)');
  await projectsPage.setEmployeeEndDate('Shraddha Ghodke(shraddha.ghodke@joshsoftware.com)', '2026-05-10');

  await projectsPage.saveTeam();
  await projectsPage.confirmSave();
});
