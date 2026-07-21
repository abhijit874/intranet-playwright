import { test } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';

// After saving Innovation Lab detail updates, this suite re-opens the edit form for the same row
// and verifies that each field was actually persisted to the server (round-trip check).
// The row is whoever is actually in the Innovation Lab, so no employee is hardcoded.

async function openFirstInnovationLabEntryForEdit(innovationLabPage: InnovationLabPage) {
  await innovationLabPage.navigateTo();
  const entry = await innovationLabPage.getFirstInnovationLabEntry({ withActions: true });
  await innovationLabPage.searchEmployee(entry.employee, entry.project);
  await innovationLabPage.clickEditIcon(entry.employee, entry.project);
  return entry;
}

test.describe('Innovation Lab - data persistence after update', () => {

  test('training plan text is persisted and pre-filled on re-opening the edit form', async ({ page }) => {
    const trainingPlan = 'playwright qa data verification';

    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    const { employee, project } = await openFirstInnovationLabEntryForEdit(innovationLabPage);
    await innovationLabPage.fillTrainingPlan(trainingPlan);
    await innovationLabPage.submitUpdate();
    await innovationLabPage.assertInnovationLabDetailsUpdated();

    // Re-open edit form and verify the saved value is pre-filled
    await innovationLabPage.searchEmployee(employee, project);
    await innovationLabPage.clickEditIcon(employee, project);
    await innovationLabPage.assertTrainingPlanValue(trainingPlan);
  });

  test('interview rejected notes are persisted and pre-filled on re-opening the edit form', async ({ page }) => {
    const interviewNotes = 'candidate declined due to location';

    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    const { employee, project } = await openFirstInnovationLabEntryForEdit(innovationLabPage);
    await innovationLabPage.fillInterviewRejected(interviewNotes);
    await innovationLabPage.submitUpdate();
    await innovationLabPage.assertInnovationLabDetailsUpdated();

    await innovationLabPage.searchEmployee(employee, project);
    await innovationLabPage.clickEditIcon(employee, project);
    await innovationLabPage.assertInterviewRejectedValue(interviewNotes);
  });

  test('comments are persisted and pre-filled on re-opening the edit form', async ({ page }) => {
    const comment = 'available from next sprint';

    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    const { employee, project } = await openFirstInnovationLabEntryForEdit(innovationLabPage);
    await innovationLabPage.fillComments(comment);
    await innovationLabPage.submitUpdate();
    await innovationLabPage.assertInnovationLabDetailsUpdated();

    await innovationLabPage.searchEmployee(employee, project);
    await innovationLabPage.clickEditIcon(employee, project);
    await innovationLabPage.assertCommentsValue(comment);
  });

});
