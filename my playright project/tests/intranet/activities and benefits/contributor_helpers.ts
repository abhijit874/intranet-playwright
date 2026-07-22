import { Page } from '@playwright/test';
import { loginWithEmail } from '../utils/login_helper';
import { loadEmployeeCsv } from './employee_csv_helpers';
import { ContributionsPage } from '../pages/activities/ContributionsPage';

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
