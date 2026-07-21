import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';

// Rows are picked from whoever is actually in the Innovation Lab, so the suite doesn't go
// stale when a hardcoded employee is later removed from it.
async function openFirstInnovationLabEntryForEdit(innovationLabPage: InnovationLabPage) {
  await innovationLabPage.navigateTo();
  const entry = await innovationLabPage.getFirstInnovationLabEntry({ withActions: true });
  await innovationLabPage.searchEmployee(entry.employee, entry.project);
  await innovationLabPage.clickEditIcon(entry.employee, entry.project);
  return entry;
}

test.describe('Innovation Lab - update form edge cases', () => {

  test('partial update with only comments filled saves successfully', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await openFirstInnovationLabEntryForEdit(innovationLabPage);
    // Leave all other fields as-is; change only comments
    await innovationLabPage.fillComments('partial update test');
    await innovationLabPage.submitUpdate();
    await innovationLabPage.assertInnovationLabDetailsUpdated();
  });

  test('clearing all optional text fields and saving does not produce an error', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await openFirstInnovationLabEntryForEdit(innovationLabPage);
    await innovationLabPage.fillTrainingPlan('');
    await innovationLabPage.fillInterviewRejected('');
    await innovationLabPage.fillComments('');
    await innovationLabPage.submitUpdate();
    await innovationLabPage.assertInnovationLabDetailsUpdated();
  });

  test('special characters in comments field are saved without error', async ({ page }) => {
    const specialCharsComment = "test & verify: it's a <QA> check @ pool";

    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    const { employee, project } = await openFirstInnovationLabEntryForEdit(innovationLabPage);
    await innovationLabPage.fillComments(specialCharsComment);
    await innovationLabPage.submitUpdate();
    await innovationLabPage.assertInnovationLabDetailsUpdated();

    // Verify special chars were persisted correctly
    await innovationLabPage.searchEmployee(employee, project);
    await innovationLabPage.clickEditIcon(employee, project);
    await innovationLabPage.assertCommentsValue(specialCharsComment);
  });

});
