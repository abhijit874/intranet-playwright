import { test, expect } from '@playwright/test';
import { VendorPage } from '../pages/VendorPage';
import { VendorDocumentPage } from '../pages/VendorDocumentPage';
import { createVendor, uniqueVendorCompany } from './vendor_helpers';
import { currentDateValue, pastDateValue, stripClientValidation } from '../utils/test_helpers';

/**
 * Vendor — negative cases.
 *
 * The vendor form carries more format-validated fields than any other in the
 * app: GST, PAN, IFSC, MSME, bank account number, phone, email, PIN code and a
 * contract date range. The positive spec derives all of them to be valid, so
 * none of that validation is actually exercised — a dropped check would pass
 * unnoticed.
 *
 * Each test submits exactly one bad value with everything else valid, so a
 * failure names the single field at fault.
 *
 * assertNotSaved() checks the form stayed on /vendors/new.
 *
 * Each format case runs twice, because they prove different things:
 *   - the plain test proves the BROWSER refuses it (pattern / type=email), which
 *     is what an ordinary user hits;
 *   - the "server-side" test strips that guard first, so the bad value actually
 *     reaches the server. Client-side validation alone is bypassable with
 *     devtools or a direct POST, which is exactly the hole behind Trello #1311.
 *
 * Where the app turns out to accept bad input, that is a defect rather than a
 * broken test and the spec carries test.fail() with a dated note, like the
 * Company negative specs.
 */
test.describe('Vendor - negative cases', () => {

  test('a malformed GST number is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bad gst'),
      gst: 'NOT-A-GST',
      expectRejected: true,
    });
    await vendorPage.assertNotSaved();
  });

  test('a malformed PAN number is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    // A PAN is 5 letters, 4 digits, 1 letter.
    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bad pan'),
      pan: '12345',
      expectRejected: true,
    });
    await vendorPage.assertNotSaved();
  });

  test('a malformed IFSC code is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    // An IFSC is 4 letters, then 0, then 6 alphanumerics.
    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bad ifsc'),
      ifsc: 'BANK123',
      expectRejected: true,
    });
    await vendorPage.assertNotSaved();
  });

  test('a malformed contact email is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bad email'),
      email: 'not-an-email',
      expectRejected: true,
    });
    await vendorPage.assertNotSaved();
  });

  test('a non-numeric contact phone number is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bad phone'),
      phone: 'call-me',
      expectRejected: true,
    });
    await vendorPage.assertNotSaved();
  });

  test('a non-numeric bank account number is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bad account'),
      accountNumber: 'ABCDEFGH',
      expectRejected: true,
    });
    await vendorPage.assertNotSaved();
  });

  test('a non-numeric PIN code is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bad pin'),
      pinCode: 'ABCDEF',
      expectRejected: true,
    });
    await vendorPage.assertNotSaved();
  });

  test('a contract end date before the start date is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    // Start today, end 30 days ago.
    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bad contract dates'),
      contractStart: currentDateValue(),
      contractEnd: pastDateValue(30),
      expectRejected: true,
    });
    await vendorPage.assertNotSaved();
  });

  // The browser-level contract-date case above only proves Chrome refused the
  // submit. Date inputs carry min/max, so that guard is the one most likely to be
  // mistaken for real validation — this strips it and asks the server.
  test('server-side: a contract end date before the start date is rejected even with client validation removed', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    await createVendor(vendorPage, {
      company: uniqueVendorCompany('server bad contract dates'),
      contractStart: currentDateValue(),
      contractEnd: pastDateValue(30),
      expectRejected: true,
      bypassClientValidation: true,
    });
    await vendorPage.assertNotSaved();
  });

  // The vendor's other date range: a document's validity period. Separate form,
  // separate controller, so the contract-date rule says nothing about it.
  test('a document whose From date is after its To date is rejected', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('hr');
    await vendorPage.navigateTo();

    const { company } = await createVendor(vendorPage, {
      company: uniqueVendorCompany('doc date range'),
    });

    const documentPage = new VendorDocumentPage(page);
    await documentPage.navigateTo();
    await documentPage.searchVendor(company);
    await documentPage.clickAddDocumentIcon(company);
    await stripClientValidation(page);

    // Valid from the end of the year until eight months earlier.
    await documentPage.fillDocumentFromDate('2026-12-31');
    await documentPage.fillDocumentToDate('2026-04-29');
    await documentPage.selectRandomDocumentType();
    await documentPage.uploadDocumentFile('tests/fixtures/image.png');
    await documentPage.submitDocument();

    await expect(page.locator('#flashes')).toContainText(/From date must be less than To Date/i);
  });

  test('searching for a vendor that does not exist shows an empty table', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    await vendorPage.searchVendor(`no such vendor ${Date.now()}`);
    await expect(page.locator('#vendor_stream_table tbody')).toContainText(/no matching records|no data/i);
  });

  // Control for the server-side cases below. If disableClientValidation() ever
  // stopped working — or started breaking the submit outright — those cases
  // would pass without the bad value ever reaching the server, and we would
  // learn nothing. This proves the bypass still submits a form successfully.
  test('control: a valid vendor still saves with client validation removed', async ({ page }) => {
    const vendorPage = new VendorPage(page);
    await vendorPage.loginAs('admin');
    await vendorPage.navigateTo();

    await createVendor(vendorPage, {
      company: uniqueVendorCompany('bypass control'),
      bypassClientValidation: true,
    });
    // createVendor asserts the success flash when expectRejected is not set.
  });

  // --- the same values again, with the browser's guard removed ------------

  const bypassCases: Array<{ what: string; cfg: Record<string, string> }> = [
    { what: 'a malformed GST number', cfg: { gst: 'NOT-A-GST' } },
    { what: 'a malformed PAN number', cfg: { pan: '12345' } },
    { what: 'a malformed IFSC code', cfg: { ifsc: 'BANK123' } },
    { what: 'a malformed contact email', cfg: { email: 'not-an-email' } },
    { what: 'a non-numeric contact phone number', cfg: { phone: 'call-me' } },
    { what: 'a non-numeric bank account number', cfg: { accountNumber: 'ABCDEFGH' } },
    { what: 'a non-numeric PIN code', cfg: { pinCode: 'ABCDEF' } },
  ];

  for (const { what, cfg } of bypassCases) {
    test(`server-side: ${what} is rejected even with client validation removed`, async ({ page }) => {
      const vendorPage = new VendorPage(page);
      await vendorPage.loginAs('admin');
      await vendorPage.navigateTo();

      await createVendor(vendorPage, {
        company: uniqueVendorCompany('server ' + what),
        ...cfg,
        expectRejected: true,
        bypassClientValidation: true,
      });
      await vendorPage.assertNotSaved();
    });
  }
});
