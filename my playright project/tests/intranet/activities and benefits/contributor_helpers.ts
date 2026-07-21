import { Page } from '@playwright/test';
import { loginWithEmail } from '../utils/login_helper';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { LdRecordPage } from '../pages/activities/LdRecordPage';
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

// Grades that contribution specs can run as. J8 is deliberately absent: employees
// are identified by joining the Employees tab (grade) with the L&D employee picker
// (email), and that picker happens to list no J8 employees — so we can't obtain a
// J8 login. Every category J8 supports is also available at J10/J11, so nothing is
// lost by routing those specs to another grade.
export type Grade = 'J7' | 'J9' | 'J10' | 'J11';

// The Employees tab exposes Emp ID + Grade (no email); the L&D employee picker
// exposes "email (id)". Emp ID is the join key. Both lookups are cached per worker
// so only the first spec that needs a given grade pays for them.
let idToEmailCache: Map<string, string> | null = null;
const gradeEmailsCache = new Map<Grade, string[]>();

// Reads "email (id)" options from the L&D employee picker.
// Assumes an hr session is already active (see getEmailsForGrade).
async function loadIdToEmail(page: Page): Promise<Map<string, string>> {
  if (idToEmailCache) return idToEmailCache;

  const ld = new LdRecordPage(page);
  await ld.navigateToCreateLdRecord();
  await page.locator('#select2-employee-container').click();
  await page.waitForTimeout(1200);
  const labels = await page.$$eval('.select2-results__option', (els) =>
    els.map((e) => (e.textContent || '').trim()).filter((t) => t.includes('@'))
  );
  await page.keyboard.press('Escape').catch(() => undefined);

  const map = new Map<string, string>();
  for (const label of labels) {
    const m = /^(\S+@\S+?)\s*\((.+)\)$/.exec(label);
    if (m) map.set(m[2].trim(), m[1].trim());
  }
  if (!map.size) throw new Error('Could not read any employees from the L&D employee picker.');

  idToEmailCache = map;
  return map;
}

// Emails of every employee at the given grade (that the picker also knows about).
async function getEmailsForGrade(page: Page, grade: Grade): Promise<string[]> {
  const cached = gradeEmailsCache.get(grade);
  if (cached?.length) return cached;

  // A lookup is needed, and each spec starts from a fresh page — so sign in as hr,
  // who can see both the L&D employee picker and the Employees tab.
  const employees = new EmployeeListPage(page);
  await employees.loginAs('hr');

  const idToEmail = await loadIdToEmail(page);

  await employees.navigateToEmployees();
  await page.waitForTimeout(1000);
  await employees.searchEmployee(grade);
  await page.waitForTimeout(1500);

  const ids = await page.$$eval(
    'table tbody tr',
    (trs, wanted) =>
      trs
        .map((tr) => {
          const td = Array.from(tr.querySelectorAll('td')).map((c) =>
            (c.textContent || '').replace(/\s+/g, ' ').trim()
          );
          return { empId: td[0], grade: td[6] };
        })
        .filter((r) => r.empId && r.grade === wanted)
        .map((r) => r.empId),
    grade
  );

  const emails = ids.map((id) => idToEmail.get(id)).filter((e): e is string => !!e);
  if (!emails.length) throw new Error(`No employees with a known email found for grade ${grade}.`);

  gradeEmailsCache.set(grade, emails);
  return emails;
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

// Signs in as an employee of the given grade who can STILL create the given
// category/subcategory — i.e. whose quota for it isn't exhausted — trying
// candidates in random order. Returns the chosen employee's email.
export async function loginAsContributorFor(
  page: Page,
  grade: Grade,
  category: string,
  subcategory?: string
): Promise<string> {
  const emails = [...(await getEmailsForGrade(page, grade))].sort(() => Math.random() - 0.5);

  for (const email of emails) {
    // The grade lookup signs in as hr, so drop that session before signing in as
    // the contributor (otherwise the login form is skipped for the dashboard).
    await page.context().clearCookies();
    await loginWithEmail(page, email);
    if (await canCreate(page, category, subcategory)) {
      // Leave the half-filled form behind so the spec starts from a clean page.
      await page.goto('/');
      return email;
    }
  }

  const what = subcategory ? `${category} / ${subcategory}` : category;
  throw new Error(
    `No ${grade} employee can currently create "${what}" — every candidate's quota looks exhausted.`
  );
}
