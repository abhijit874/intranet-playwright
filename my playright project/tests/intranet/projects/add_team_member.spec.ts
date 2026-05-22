import { test } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

test('add team member flow - open projects page', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();
  await projectsPage.search('playwright automation');
  await projectsPage.clickEditOnRow('playwright automation');
  await projectsPage.openTeamDetailsTab();
  await projectsPage.addTeamMember(
    'Abhijit Kasbe(abhijit.kasbe@joshsoftware.com)',
    '2026-05-10',
    '2026-11-30',
    'BC_ACRP_4'
  );
  await projectsPage.saveTeam();
  await projectsPage.confirmSave();
});
