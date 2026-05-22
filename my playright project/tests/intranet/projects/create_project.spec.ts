import { test } from '@playwright/test';
import { ProjectsPage } from '../pages/ProjectsPage';

test('create new project', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.loginAs('hr');
  await projectsPage.navigateTo();
  await projectsPage.clickNewProject();

  await projectsPage.selectCompany('1 Factory');
  await projectsPage.fillProjectName('Gemini');
  await projectsPage.selectDomain('Other');
  await projectsPage.fillDisplayName('Gemini');
  await projectsPage.selectBillingFrequency('NA');
  await projectsPage.selectBusinessUnit('BFSI');
  await projectsPage.selectTypeOfProject('T&M');
  await projectsPage.selectBillBy('NA');
  await projectsPage.selectInvoiceBy('Josh');
  await projectsPage.selectSowStatus('SOW/MSA Not Required');
  await projectsPage.setStartDate('2026-05-10');
  await projectsPage.setEndDate('2026-12-31');
  await projectsPage.setSowStartDate('2026-06-01');
  await projectsPage.setSowEndDate('2026-11-30');
  await projectsPage.selectProjectManager('Pooja Mane(pooja@joshsoftware.com)', 'Pooja Mane');
  await projectsPage.selectSalesHead('Kushal Dev(kushal.dev@joshsoftware.com)');
  await projectsPage.selectDeliveryHead('Sameer Tilak(sameer@joshsoftware.com)');
  await projectsPage.selectDeliveryVP('Sameer Tilak(sameer@joshsoftware.com)');
  await projectsPage.selectProductManager('Saurabh Gaji(saurabh.gaji@joshsoftware.com)');
  await projectsPage.fillProjectCode('pw345');
  await projectsPage.submitNewProject();
});
