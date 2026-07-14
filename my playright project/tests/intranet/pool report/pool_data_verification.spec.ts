import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

// After saving pool detail updates, this suite re-opens the edit form for the same row
// and verifies that each field was actually persisted to the server (round-trip check).

const employeeName = 'Abhijit Kasbe';                                       // change before running
const projectName  = 'Iziel: Solution architect + Developer (Renewal)';     // change before running

test.describe('Pool report - data persistence after update', () => {

  test('training plan text is persisted and pre-filled on re-opening the edit form', async ({ page }) => {
    const trainingPlan = 'playwright qa data verification';

    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.fillTrainingPlan(trainingPlan);
    await poolPage.submitUpdate();
    await poolPage.assertPoolDetailsUpdated();

    // Re-open edit form and verify the saved value is pre-filled
    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.assertTrainingPlanValue(trainingPlan);
  });

  test('interview rejected notes are persisted and pre-filled on re-opening the edit form', async ({ page }) => {
    const interviewNotes = 'candidate declined due to location';

    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.fillInterviewRejected(interviewNotes);
    await poolPage.submitUpdate();
    await poolPage.assertPoolDetailsUpdated();

    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.assertInterviewRejectedValue(interviewNotes);
  });

  test('comments are persisted and pre-filled on re-opening the edit form', async ({ page }) => {
    const comment = 'available from next sprint';

    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.fillComments(comment);
    await poolPage.submitUpdate();
    await poolPage.assertPoolDetailsUpdated();

    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.assertCommentsValue(comment);
  });

});
