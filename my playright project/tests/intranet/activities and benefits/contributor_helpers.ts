import { Page } from '@playwright/test';
import { loginWithEmail } from '../utils/login_helper';
import { validCurrentQuarterDate } from '../utils/test_helpers';
import { loadEmployeeCsv } from './employee_csv_helpers';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { ContributionsApprovalPage } from '../pages/activities/ContributionsApprovalPage';

// Contribution access is driven by the employee's GRADE, not their role:
//   * J6 and below cannot create contributions at all.
//   * Categories by grade:
//       - Blog Writing              -> J7, J9, J10, J11   (not J8)
//       - Open Source Contribution  -> J8, J10, J11       (not J7, J9)
//       - everything else           -> J7..J11
//   * Subcategories by grade (only these differ):
//       - Innovation Talk / Josh Events -> J10, J11 only
//       - Campus Drive Interviewer      -> J8, J10, J11
//       - Monthly Contribution          -> J7, J9, J10, J11 (not J8)
//       - Hackathons                    -> J7, J8, J9 only
//
// On top of that, each category/subcategory has a per-employee QUOTA: once an
// employee uses theirs up, that category disappears from their form. So a fixed
// contributor would eventually be unable to create records. Specs therefore ask for
// an employee of the required grade who can STILL create the category they need,
// trying candidates in random order — which spreads records across real people and
// sidesteps exhausted quotas.
//
// Every account shares one password, so any employee can be signed in by email.
// Grade and email both come straight from the Employees CSV export (see
// employee_csv_helpers), so no UI scraping or Emp-ID joining is needed.

export type Grade = 'J7' | 'J8' | 'J9' | 'J10' | 'J11';

// Emails of every approved employee at the given grade, from the CSV export.
async function getEmailsForGrade(page: Page, grade: Grade, refresh = false): Promise<string[]> {
  const rows = await loadEmployeeCsv(page, { refresh });
  return rows.filter((r) => r.grade === grade && r.email).map((r) => r.email);
}

function shuffled(values: string[]): string[] {
  return [...values].sort(() => Math.random() - 0.5);
}

// Can the signed-in contributor still create this category/subcategory? A category
// disappears from their form once their quota for it is used up, so this is both a
// grade check and a quota check.
async function canCreate(page: Page, category: string, subcategory?: string): Promise<boolean> {
  const contributions = new ContributionsPage(page);
  try {
    await contributions.navigateToContributions();
    await contributions.clickAddContribution();
    await contributions.selectCategory(category);
    if (subcategory) await contributions.selectSubcategory(subcategory);
    return true;
  } catch {
    return false;
  }
}

// Creates a contribution as a grade-eligible employee and approves it as hr.
// Used by the approval spec's empty-queue fallback, and by the redeem spec:
// an approved benefit record credits its amount to the record's CREATOR, so
// this chain is also how redeemable balance is produced on demand.
// Returns the creator's email, the record's unique title, and the approval
// outcome ('approved' | 'quota-blocked' — the latter credits nothing).
export async function createAndApproveContribution(
  page: Page,
  grade: Grade = 'J11',
  category = 'Innovation Lab',
  subcategory = 'Monthly Contribution'
): Promise<{ email: string; title: string; outcome: 'approved' | 'quota-blocked' }> {
  const title = `auto-approve-${Date.now()}`;
  const date = validCurrentQuarterDate();

  const contributions = new ContributionsPage(page);
  const email = await loginAsContributorFor(page, grade, category, subcategory);
  await contributions.navigateToContributions();
  await contributions.clickAddContribution();
  await contributions.selectCategory(category);
  await contributions.selectSubcategory(subcategory);
  await contributions.fillTitle(title);
  await contributions.fillDate(date);
  await contributions.attachFile('#timesheet_attachment', 'tests/fixtures/image.png');
  await contributions.submitContribution();
  await contributions.assertSaved();

  // The approval table shows the employee's name; the CSV maps email -> name.
  const employeeName = (await loadEmployeeCsv(page)).find((r) => r.email === email)?.name ?? '';

  await page.context().clearCookies();
  const approvalPage = new ContributionsApprovalPage(page);
  await approvalPage.loginAs('hr');
  await approvalPage.navigateToContributionsApproval();
  const outcome = await approvalPage.approveContribution({
    title,
    date,
    employeeName,
    category,
    subcategory,
  });
  return { email, title, outcome };
}

// Signs in as an employee who has redeemable balance (accrued from their
// approved contributions), trying grade-eligible CSV candidates in random
// order. Balance depends entirely on what has been approved for whom, so it
// cannot be conjured — after maxCandidates attempts null is returned and the
// caller decides (skip, or point REDEEM_EMAIL at a known account).
export async function loginAsEmployeeWithBalance(
  page: Page,
  maxCandidates = 12
): Promise<string | null> {
  const rows = await loadEmployeeCsv(page);
  const emails = shuffled(
    rows.filter((r) => /^J(7|8|9|10|11)$/.test(r.grade) && r.email).map((r) => r.email)
  ).slice(0, maxCandidates);

  const contributions = new ContributionsPage(page);
  for (const email of emails) {
    await page.context().clearCookies();
    try {
      await loginWithEmail(page, email);
    } catch {
      continue; // stale CSV row — employee may have left
    }
    try {
      await contributions.navigateToContributions();
    } catch {
      continue;
    }
    if (await contributions.hasRedeemableBalance()) return email;
  }
  return null;
}

// Tries each candidate in turn; returns the first email that can still create
// the category, or null when every candidate is exhausted or cannot sign in.
async function firstUsableContributor(
  page: Page,
  emails: string[],
  category: string,
  subcategory?: string
): Promise<string | null> {
  for (const email of emails) {
    // The CSV download may have signed in as hr, so drop any session before
    // signing in as the contributor (otherwise the login form is skipped for
    // the dashboard).
    await page.context().clearCookies();
    try {
      await loginWithEmail(page, email);
    } catch {
      // The CSV may be stale — this employee may have left since it was
      // downloaded. Just move on to the next candidate.
      continue;
    }
    if (await canCreate(page, category, subcategory)) {
      // Leave the half-filled form behind so the spec starts from a clean page.
      await page.goto('/');
      return email;
    }
  }
  return null;
}

// Signs in as an employee of the given grade who can STILL create the given
// category/subcategory — i.e. whose quota for it isn't exhausted — trying
// candidates in random order. Returns the chosen employee's email.
//
// The CSV on disk is reused indefinitely; only when it yields no usable
// candidate is a fresh copy downloaded (replacing the old one) and any NEW
// employees it lists tried as well.
export async function loginAsContributorFor(
  page: Page,
  grade: Grade,
  category: string,
  subcategory?: string
): Promise<string> {
  let emails = await getEmailsForGrade(page, grade);
  const found = await firstUsableContributor(page, shuffled(emails), category, subcategory);
  if (found) return found;

  // Nobody in the current CSV worked — refresh it and try anyone new.
  const freshEmails = (await getEmailsForGrade(page, grade, true)).filter(
    (e) => !emails.includes(e)
  );
  const foundFresh = await firstUsableContributor(page, shuffled(freshEmails), category, subcategory);
  if (foundFresh) return foundFresh;

  const what = subcategory ? `${category} / ${subcategory}` : category;
  throw new Error(
    `No ${grade} employee can currently create "${what}" — every candidate's quota looks exhausted.`
  );
}
