import { test } from '@playwright/test';
import { PoolReportPage } from '../pages/PoolReportPage';

const employeeName = 'Abhijit Kasbe';  // change before running
const projectName  = 'Iziel: Solution architect + Developer (Renewal)';   // change before running
const oetaDate     = '2026-05-21';                                        // change before running
const netaDate     = '2026-06-01';                                        // change before running

test('update pool details', async ({ page }) => {
  const poolPage = new PoolReportPage(page);
  await poolPage.loginAs('admin');
  await poolPage.navigateTo();
  await poolPage.searchEmployee(employeeName, projectName);
  await poolPage.clickEditIcon(employeeName, projectName);

  await poolPage.fillOeta(oetaDate);
  await poolPage.fillNeta(netaDate);
  await poolPage.selectProposedProject('AI drones');
  await poolPage.fillTrainingPlan('playwright automation');
  await poolPage.fillInterviewRejected('this is test');
  await poolPage.fillComments('this is test');
  await poolPage.submitUpdate();
  await poolPage.assertPoolDetailsUpdated();
});
