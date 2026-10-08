import * as path from 'path';
import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';
import { createProject, uniqueProjectName } from './projects_helpers';

const NOT_AN_IMAGE = path.resolve(__dirname, '../../fixtures/not-an-image.txt');

/**
 * Projects — negative cases.
 *
 * A project carries two date ranges that have to agree with each other (the
 * project's own start/end, and the SOW's), plus a project code that has to be
 * unique. Project NAMES are deliberately not unique: one client can run several
 * projects with the same name, distinguished by their code. The positive spec
 * only ever supplies consistent values, so none of those rules are exercised.
 *
 * Each test changes exactly one thing, so a failure names the single rule at
 * fault. Every case strips the browser's own validation first
 * (bypassClientValidation) — otherwise a pass might only mean Chrome refused to
 * submit, which a user bypasses with devtools or a direct POST. The server is
 * what has to say no. The control test below proves that bypass still submits.
 *
 * assertNotCreated() checks no "Project created Successfully" flash appeared.
 *
 * Role: hr, matching the positive specs. Admin has no "Add Project" link — the
 * same split seen on Company, where creating is an HR job rather than an admin one.
 */
test.describe('Projects - negative cases', () => {

  test('control: a valid project still saves with client validation removed', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    // Asserts the success flash, since expectRejected is not set. If this fails,
    // the bypass itself is broken and every negative case below is meaningless.
    await createProject(projectsPage, { bypassClientValidation: true });
  });

  test('a project end date before the start date is rejected', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    await createProject(projectsPage, {
      startDate: '2026-12-31',
      endDate: '2026-05-10',
      sowStartDate: '2026-05-10',
      sowEndDate: '2026-05-31',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await projectsPage.assertNotCreated();
  });

  test('a SOW end date before the SOW start date is rejected', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    await createProject(projectsPage, {
      sowStartDate: '2026-05-31',
      sowEndDate: '2026-05-10',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await projectsPage.assertNotCreated();
  });

  test('a SOW end date after the project end date is rejected', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    // Project ends 2026-12-31; the SOW is made to run a year beyond it.
    await createProject(projectsPage, {
      sowStartDate: '2026-05-10',
      sowEndDate: '2027-12-31',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await projectsPage.assertNotCreated();
  });

  // Duplicate project NAMES are allowed by design: one client can run several
  // projects sharing a name, told apart by their unique project code. So this
  // asserts the duplicate saves — it is the code that has to be unique (next
  // test). Written as a negative-suite case because it is the boundary that a
  // uniqueness change would most easily break in the wrong direction.
  test('a duplicate project name is allowed when the code differs', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    const { name } = await createProject(projectsPage);

    await projectsPage.navigateTo();
    // Same name, fresh code — this must save.
    await createProject(projectsPage, {
      name,
      code: `pw${Date.now()}`,
      bypassClientValidation: true,
    });
    // createProject asserts the success flash when expectRejected is not set.
  });

  test('a duplicate project code is rejected', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    const { code } = await createProject(projectsPage);

    await projectsPage.navigateTo();
    // Same code, fresh name — so only the code can be what is refused.
    await createProject(projectsPage, {
      name: uniqueProjectName('dup code'),
      code,
      expectRejected: true,
      bypassClientValidation: true,
    });
    await projectsPage.assertNotCreated();
  });

  test('a SOW start date before the project start date is rejected', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    // The project runs 2026-05-10 to 2026-12-31; the SOW is made to begin a
    // month before the project itself does.
    await createProject(projectsPage, {
      sowStartDate: '2026-04-10',
      sowEndDate: '2026-05-31',
      expectRejected: true,
      bypassClientValidation: true,
    });
    await projectsPage.assertNotCreated();
  });

  // Uniqueness on the edit path. Creation refuses a duplicate code (above), but
  // that is a separate code path from the update action — a rule enforced only
  // on create leaves the same collision reachable through Edit.
  test('an existing project cannot be edited to take another project code', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    const { code: takenCode } = await createProject(projectsPage);

    await projectsPage.navigateTo();
    const { name: secondName } = await createProject(projectsPage);

    await projectsPage.navigateTo();
    await projectsPage.clickEditOnRow(secondName);
    await projectsPage.fillProjectCode(takenCode);
    await projectsPage.saveProjectEdit();
    await projectsPage.assertNotUpdated();
  });

  // Upload validation. Both image fields are required, so the form clearly cares
  // that they are present — this asks whether it also cares what they contain.
  // The file is a plain text file renamed to nothing in particular; the browser's
  // own accept="" filter does not apply to a programmatic upload, which is the
  // same position an attacker posting directly is in.
  test('a non-image file is rejected as the client logo', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    await createProject(projectsPage, {
      clientLogoPath: NOT_AN_IMAGE,
      expectRejected: true,
      bypassClientValidation: true,
    });
    await projectsPage.assertNotCreated();
  });

  test('a non-image file is rejected as the project image', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    await createProject(projectsPage, {
      projectImagePath: NOT_AN_IMAGE,
      expectRejected: true,
      bypassClientValidation: true,
    });
    await projectsPage.assertNotCreated();
  });

  test('searching for a project that does not exist shows an empty table', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.loginAs('hr');
    await projectsPage.navigateTo();

    await projectsPage.search(`no such project ${Date.now()}`);
    await expect(page.locator('#sortable tbody')).toContainText(/no matching records|no data/i);
  });
});
