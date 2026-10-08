import { test, expect } from '@playwright/test';
import { CompanyPage } from '../pages/CompanyPage';
import { createCompany, uniqueCompanyName } from './company_helpers';

/**
 * Company — negative cases.
 *
 * The positive specs prove a valid company saves. These prove the app refuses
 * invalid input, which is where regressions actually hide: a dropped validation
 * is invisible to a happy-path suite.
 *
 * Each test submits one deliberately bad value with everything else valid, so a
 * failure names the single field at fault rather than "the form broke".
 *
 * Where the app turns out to accept bad input, that is a defect, not a broken
 * test: those carry test.fail() with the tracking note, exactly like the
 * activity-date specs (#1311). They pass by failing and will report
 * "unexpectedly passed" the day validation is added.
 */
test.describe('Company - negative cases', () => {

  test('duplicate company name is rejected', async ({ page }) => {
    const companyPage = new CompanyPage(page);
    await companyPage.loginAs('hr');
    await companyPage.navigateTo();

    // Create one, then try to create a second with the same name. The setup
    // create does not assert on the flash — it auto-dismisses and is missed
    // often enough to fail the test for the wrong reason — so confirm the
    // company exists by finding its row instead.
    const { name } = await createCompany(companyPage, { expectRejected: true });
    await companyPage.navigateTo();
    await companyPage.searchCompany(name);
    await expect(await companyPage.findCompanyRow(name)).toBeVisible({ timeout: 20000 });

    await companyPage.navigateTo();
    await createCompany(companyPage, { name, expectRejected: true });
    await companyPage.assertNotCreated();
  });

  // CONFIRMED DEFECT (2026-09-24): a second company saves with a GST number
  // that already belongs to another company. Duplicate NAMES are rejected, so
  // the uniqueness rule exists — it just is not applied to the GST number.
  test.fail('duplicate GST number is rejected', async ({ page }) => {
    const companyPage = new CompanyPage(page);
    await companyPage.loginAs('hr');
    await companyPage.navigateTo();

    const gst = `27ABCDE${Date.now().toString().slice(-4)}F1Z5`;
    const { name: firstName } = await createCompany(companyPage, { gst, expectRejected: true });
    await companyPage.navigateTo();
    await companyPage.searchCompany(firstName);
    await expect(await companyPage.findCompanyRow(firstName)).toBeVisible({ timeout: 20000 });

    await companyPage.navigateTo();
    await createCompany(companyPage, { name: uniqueCompanyName('dup gst'), gst, expectRejected: true });
    await companyPage.assertNotCreated();
  });

  // CONFIRMED DEFECT (2026-09-24): the app accepts this and creates the company.
  // Marked test.fail() so the suite stays green while the gap is open; it will
  // report "unexpectedly passed" once validation is added.
  test.fail('a malformed GST number is rejected', async ({ page }) => {
    const companyPage = new CompanyPage(page);
    await companyPage.loginAs('hr');
    await companyPage.navigateTo();

    // A valid GSTIN is 15 characters: 2-digit state code, 10-char PAN, entity
    // digit, 'Z', checksum. This is none of those.
    await createCompany(companyPage, {
      name: uniqueCompanyName('bad gst'),
      gst: 'NOT-A-GST-NUMBER',
      expectRejected: true,
    });
    await companyPage.assertNotCreated();
  });

  // CONFIRMED DEFECT (2026-09-24): the app accepts this and creates the company.
  // Marked test.fail() so the suite stays green while the gap is open; it will
  // report "unexpectedly passed" once validation is added.
  test.fail('a non-numeric PIN code is rejected', async ({ page }) => {
    const companyPage = new CompanyPage(page);
    await companyPage.loginAs('hr');
    await companyPage.navigateTo();

    await createCompany(companyPage, {
      name: uniqueCompanyName('bad pin'),
      pinCode: 'ABCDEF',
      expectRejected: true,
    });
    await companyPage.assertNotCreated();
  });

  test('a malformed website URL is rejected', async ({ page }) => {
    const companyPage = new CompanyPage(page);
    await companyPage.loginAs('hr');
    await companyPage.navigateTo();

    await createCompany(companyPage, {
      name: uniqueCompanyName('bad website'),
      website: 'not a url',
      expectRejected: true,
    });
    await companyPage.assertNotCreated();
  });

  // CONFIRMED DEFECT (2026-09-24): the app accepts this and creates the company.
  // Marked test.fail() so the suite stays green while the gap is open; it will
  // report "unexpectedly passed" once validation is added.
  test.fail('a non-numeric landline is rejected', async ({ page }) => {
    const companyPage = new CompanyPage(page);
    await companyPage.loginAs('hr');
    await companyPage.navigateTo();

    await createCompany(companyPage, {
      name: uniqueCompanyName('bad landline'),
      landline: 'call-me-maybe',
      expectRejected: true,
    });
    await companyPage.assertNotCreated();
  });

  test('searching for a company that does not exist shows an empty table', async ({ page }) => {
    const companyPage = new CompanyPage(page);
    await companyPage.loginAs('hr');
    await companyPage.navigateTo();

    await companyPage.searchCompany(`no such company ${Date.now()}`);
    await expect(page.locator('#companies_list tbody')).toContainText(/no matching records|no data/i);
  });
});
