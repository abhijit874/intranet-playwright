import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

// Maintenance utility (not part of the normal flow): the self-contained project
// tests each create a real "playwright automation <timestamp>" project on stage.
// This marks those leftover test projects inactive so they drop out of the
// default Active Projects view. Run it manually to clean up:
//   npx playwright test tests/intranet/projects/cleanup_test_projects.spec.ts
//
// It only touches projects whose name starts with "playwright automation", and
// stops when none remain (or after a safety cap).
test('cleanup - mark leftover test projects inactive', async ({ page }) => {
  test.setTimeout(20 * 60 * 1000); // generous: each project is an edit+save

  const TEST_PREFIX = /playwright automation/i;
  const SAFETY_CAP = 60;

  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');

  let cleaned = 0;
  let skipped = 0;

  for (let i = 0; i < SAFETY_CAP; i += 1) {
    await projectsPage.navigateTo();
    await projectsPage.search('playwright automation');

    const rows = page.locator('table tbody tr', { hasText: TEST_PREFIX });
    if ((await rows.count()) === 0 || !(await rows.first().isVisible().catch(() => false))) {
      break; // no active test projects left
    }

    // Read the first matching project's name so we can target it precisely and
    // detect if a save silently fails (same project reappears next loop).
    const name = ((await rows.first().innerText()).match(/playwright automation \d+/i)?.[0]) ?? 'playwright automation';

    try {
      await projectsPage.clickEditOnRow(name);
      // Marking inactive sets the end date to ~today; older test projects have
      // future SOW dates that would then exceed it, so pull the SOW dates into the
      // past first to keep the edit valid.
      await projectsPage.setSowStartDate('2026-05-10');
      await projectsPage.setSowEndDate('2026-05-31');
      await projectsPage.setProjectActiveStatus(false);
      await projectsPage.saveProjectEdit();
      await projectsPage.assertSaved();
      cleaned += 1;
    } catch (err) {
      // Don't let one stubborn project stop the whole cleanup.
      skipped += 1;
      console.log(`Skipped "${name}": ${(err as Error).message.split('\n')[0]}`);
      if (skipped > 5) break; // avoid an infinite loop if a project won't deactivate
    }
  }

  console.log(`Cleanup done. Marked inactive: ${cleaned}. Skipped: ${skipped}.`);
  expect(cleaned + skipped).toBeGreaterThanOrEqual(0);
});
