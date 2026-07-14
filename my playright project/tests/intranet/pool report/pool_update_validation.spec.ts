import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

const employeeName = 'Divya Tambat ';                                       // change before running
const projectName  = 'Pool-BFSI';     // change before running

test.describe('Pool report - update form edge cases', () => {

  test('partial update with only comments filled saves successfully', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    // Leave all other fields as-is; change only comments
    await poolPage.fillComments('partial update test');
    await poolPage.submitUpdate();
    await poolPage.assertPoolDetailsUpdated();
  });

  test('clearing all optional text fields and saving does not produce an error', async ({ page }) => {
    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.fillTrainingPlan('');
    await poolPage.fillInterviewRejected('');
    await poolPage.fillComments('');
    await poolPage.submitUpdate();
    await poolPage.assertPoolDetailsUpdated();
  });

  test('special characters in comments field are saved without error', async ({ page }) => {
    const specialCharsComment = "test & verify: it's a <QA> check @ pool";

    const poolPage = new PoolReportPage(page);
    await poolPage.loginAs('admin');
    await poolPage.navigateTo();
    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.fillComments(specialCharsComment);
    await poolPage.submitUpdate();
    await poolPage.assertPoolDetailsUpdated();

    // Verify special chars were persisted correctly
    await poolPage.searchEmployee(employeeName, projectName);
    await poolPage.clickEditIcon(employeeName, projectName);
    await poolPage.assertCommentsValue(specialCharsComment);
  });

});
