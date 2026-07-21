import * as path from 'path';
import { ProjectsPage } from '../pages/ProjectsPage';

const IMAGE_PATH = path.resolve(__dirname, '../../fixtures/image.png');

// Shared builder for the project specs so every test can create its own project
// (self-contained — no dependency on a pre-seeded project). Mirrors the asset
// helpers. Project name and code must be unique, so both are stamped per run.

export interface CreateProjectResult {
  name: string;
  code: string;
}

export interface CreateProjectOptions {
  name?: string;
  code?: string;
  sowStatus?: string;
}

export function uniqueProjectName(prefix = 'playwright automation'): string {
  return `${prefix} ${Date.now()}`;
}

// Fills the full new-project form with the same known-good values as the original
// create_project spec (company, people, dates), submits, and verifies creation.
// Returns the unique name/code so callers can locate the exact project afterwards.
// Assumes navigateTo() has already been called.
export async function createProject(
  projectsPage: ProjectsPage,
  options: CreateProjectOptions = {}
): Promise<CreateProjectResult> {
  const stamp = Date.now();
  const name = options.name ?? `playwright automation ${stamp}`;
  const code = options.code ?? `pw${stamp}`;

  await projectsPage.clickNewProject();
  // Company/domain/business-unit are descriptive only, so pick them at random —
  // the dropdowns hold nothing but valid values.
  await projectsPage.selectRandomCompany();
  await projectsPage.fillProjectName(name);
  await projectsPage.selectRandomDomain();
  await projectsPage.fillDisplayName(name);
  // Billing frequency / type of project / bill-by / invoice-by stay fixed: they
  // drive conditional fields and validation on this form.
  await projectsPage.selectBillingFrequency('NA');
  await projectsPage.selectRandomBusinessUnit();
  await projectsPage.selectTypeOfProject('T&M');
  await projectsPage.selectBillBy('NA');
  await projectsPage.selectInvoiceBy('Josh');
  await projectsPage.selectSowStatus(options.sowStatus ?? 'SOW/MSA Not Required');
  await projectsPage.setStartDate('2026-05-10');
  await projectsPage.setEndDate('2026-12-31');
  // Keep SOW dates in the past so they never exceed the project end date — marking
  // a project inactive sets its end date to ~today, and the server rejects SOW
  // dates later than the end date.
  await projectsPage.setSowStartDate('2026-05-10');
  await projectsPage.setSowEndDate('2026-05-31');
  // Any valid person is accepted for these, so pick them at random. The project
  // manager stays fixed — the "update project flow on edit" test asserts on it.
  await projectsPage.selectProjectManager('Pooja Mane(pooja@joshsoftware.com)', 'Pooja Mane');
  await projectsPage.selectRandomSalesHead();
  await projectsPage.selectRandomDeliveryHead(); // Engineering Manager
  await projectsPage.selectRandomDeliveryVP();
  await projectsPage.selectRandomProductManager(); // HR
  await projectsPage.fillProjectCode(code);
  // Client Logo and project image are both required.
  await projectsPage.uploadClientLogo(IMAGE_PATH);
  await projectsPage.uploadProjectImage(IMAGE_PATH);
  await projectsPage.submitNewProject();
  await projectsPage.assertCreated();

  return { name, code };
}
