import { Page, Locator, expect } from '@playwright/test';

export function currentDateValue(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

// A date `daysAgo` days in the past (default: yesterday), formatted YYYY-MM-DD.
export function pastDateValue(daysAgo = 1): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// A date `daysAhead` days in the future (default: tomorrow), formatted YYYY-MM-DD.
// Used by negative tests to attempt a future Activity Date that the system must
// reject.
export function futureDateValue(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// A valid Activity Date for "today": a recent past date guaranteed to fall
// within the current quarter (3 days ago, clamped to the quarter start so it
// never slips into the previous quarter). Used by happy-flow tests.
export function validCurrentQuarterDate(): string {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
  const d = threeDaysAgo < quarterStart ? quarterStart : threeDaysAgo;
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

// First day of the current calendar quarter (Jan/Apr/Jul/Oct 1st), e.g. for any
// month Apr–Jun this returns YYYY-04-01.
export function currentQuarterStartValue(): string {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3; // 0, 3, 6, 9
  return [now.getFullYear(), String(quarterStartMonth + 1).padStart(2, '0'), '01'].join('-');
}

// A date in the PREVIOUS calendar quarter — the day before the current quarter
// start (i.e. the last day of the previous quarter), formatted YYYY-MM-DD. Used
// by negative tests: the Activity Date input blocks it with `min = quarter start`,
// but a forced out-of-range value must still be rejected by the server.
export function previousQuarterDateValue(): string {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
  const prev = new Date(quarterStart.getTime() - 86400000); // day before quarter start
  return [
    prev.getFullYear(),
    String(prev.getMonth() + 1).padStart(2, '0'),
    String(prev.getDate()).padStart(2, '0'),
  ].join('-');
}

// Validation — the Activity Date input must only allow dates within the current
// quarter up to today: `min` must be the current quarter start and `max` must be
// the current date (so neither past-quarter nor future dates can be selected).
export async function assertActivityDateWithinRange(page: Page, fieldSelector = '#activity_date') {
  const field = page.locator(fieldSelector);
  await expect(field).toBeVisible();
  const min = await field.getAttribute('min');
  const max = await field.getAttribute('max');

  const today = currentDateValue();
  const quarterStart = currentQuarterStartValue();

  expect(max, `Activity Date max (${max}) must be today (${today}) so future dates cannot be selected.`).toBe(today);
  expect(min, `Activity Date min (${min}) must be the current quarter start (${quarterStart}) so earlier dates cannot be selected.`).toBe(quarterStart);
}

// Asserts a flash/toast message after a form submission.
//
// Flash messages render on the post-submit redirect and then auto-dismiss, so
// they are only in the DOM for a short window. The naive two-step check
// (`toBeVisible()` then `toContainText()`) is racy: the flash can fade in the gap
// between the two assertions, so the first passes and the second misses it.
//
// A single web-first `toContainText` assertion is robust: it waits for the
// element AND the text together, re-queries if the flash re-renders, and does not
// require visibility — so it reliably catches the message during its lifetime.
export async function expectFlashMessage(
  page: Page,
  expectedText: string,
  description = 'submission',
  timeout = 15_000
) {
  const flash = page.locator('#flashes');
  try {
    await expect(flash).toContainText(expectedText, { timeout });
  } catch {
    throw new Error(`Success alert "${expectedText}" was not displayed after ${description}.`);
  }
}

export async function selectDropdownByValue(page: Page, selector: string, value: string) {
  await page.locator(selector).selectOption(value);
  await expect(page.locator(selector)).toHaveValue(value);
}

export async function selectFromSingleSelect2(page: Page, containerSelector: string, optionText: string) {
  await page.locator(containerSelector).click();
  const containerId = containerSelector.startsWith('#') ? containerSelector.slice(1) : null;
  const fieldId = containerId
    ? containerId.replace(/^select2-/, '').replace(/-container$/, '')
    : null;
  const selectorParts: string[] = [];
  if (containerId) selectorParts.push(`.select2-search__field[aria-describedby="${containerId}"]`);
  if (fieldId) selectorParts.push(`.select2-search__field[aria-controls="select2-${fieldId}-results"]`);
  selectorParts.push('.select2-container--open .select2-search__field');
  const searchInput = page.locator(selectorParts.join(', ')).first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill(optionText);
  await searchInput.press('ArrowDown');
  await searchInput.press('Enter');
  await expect(page.locator('body .select2-container--open')).toHaveCount(0);
}

export async function selectFromMultiSelect2(
  page: Page,
  containerSelector: string,
  optionText: string,
  expectedText: string
) {
  const containerId = containerSelector.replace(/^#/, '');
  const selection = page
    .locator(`#${containerId}`)
    .locator('xpath=ancestor::span[contains(@class,"select2-selection")][1]');
  await expect(selection).toBeVisible();
  await selection.click();
  const searchInput = page.locator(`.select2-search__field[aria-describedby="${containerId}"]`).first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill(optionText);
  // Click the matching result by its text. Select2 re-renders option ids on each
  // keystroke (so aria-activedescendant ids go stale) and doesn't always
  // auto-highlight the match on the edit form, so match on the visible text. The
  // results can load via AJAX, so allow extra time.
  const option = page
    .locator('li.select2-results__option')
    .filter({ hasText: optionText })
    .first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
  await expect(page.locator(containerSelector)).toContainText(expectedText);
  // A multi-select2 keeps its dropdown open after a pick; close it so the next
  // field's select2 doesn't collide with a still-open dropdown.
  await page.keyboard.press('Escape');
  await expect(page.locator('body .select2-container--open')).toHaveCount(0);
}

export async function selectAssetDropdown(page: Page, containerSelector: string, optionText: string) {
  await page.locator(containerSelector).click();
  await page.getByRole('option', { name: optionText, exact: true }).click();
  await expect(page.locator(containerSelector)).toContainText(optionText);
}

export async function searchProject(page: Page, employeeName: string, projectName?: string) {
  const nameCandidates = [
    page.locator('#dt-search-0').first(),
    page.locator('[id^="dt-search-"]').first(),
    page.getByPlaceholder(/search/i).first(),
    page.locator('input[type="search"]').first(),
  ];
  let nameSearched = false;
  for (const input of nameCandidates) {
    if (await input.count()) {
      await input.fill(employeeName);
      await input.press('Enter');
      nameSearched = true;
      break;
    }
  }
  if (!nameSearched) throw new Error('Search input not found.');

  if (projectName) {
    const projectCandidates = [
      page.locator('input[placeholder*="project" i]').first(),
      page.locator('input[placeholder*="Project Name" i]').first(),
      page.locator('[id^="dt-search-"]').nth(1),
    ];
    let projectSearched = false;
    for (const input of projectCandidates) {
      if (await input.count()) {
        await input.fill(projectName);
        await input.press('Enter');
        projectSearched = true;
        break;
      }
    }
    if (!projectSearched) throw new Error('Project search input not found.');
  }
}

// Drives a DataTables-style search box so row lookups span every page of a
// paginated table — DataTables filters across all pages, not just the rows
// currently rendered in the DOM. Returns false (no-op) when the page has no
// search box. The term is trimmed so trailing/leading spaces don't break the
// match.
export async function filterTableBySearch(page: Page, term: string): Promise<boolean> {
  const candidates = [
    page.getByRole('searchbox', { name: /search/i }),
    page.locator('#dt-search-0'),
    page.locator('[id^="dt-search-"]'),
    page.locator('input[type="search"]'),
    page.getByPlaceholder(/search/i),
  ];
  for (const candidate of candidates) {
    const input = candidate.first();
    if (await input.count()) {
      await input.fill(term.trim());
      return true;
    }
  }
  return false;
}

export async function clickFirstVisible(candidates: Locator[]) {
  for (const candidate of candidates) {
    if (!(await candidate.count())) continue;
    if (await candidate.first().isVisible()) {
      await candidate.first().click();
      return;
    }
  }
  throw new Error('No visible matching element found to click.');
}

// Sets a date input's value via JS, bypassing the native picker's UI.
//
// `stripConstraints` additionally removes the input's `min`/`max` attributes.
// This matters for negative tests: setting the value alone does NOT bypass the
// browser's submit-time HTML5 constraint validation — an out-of-range value
// (e.g. a future date past `max`) is `:invalid` and the browser silently blocks
// the form submission, so the request never reaches the server. Stripping the
// constraints lets the POST go through so SERVER-side validation is actually
// exercised.
export async function setDateByEvaluate(
  locator: Locator,
  value: string,
  options: { stripConstraints?: boolean } = {}
) {
  await locator.evaluate(
    (el: HTMLInputElement, args: { value: string; stripConstraints: boolean }) => {
      if (args.stripConstraints) {
        el.removeAttribute('max');
        el.removeAttribute('min');
      }
      el.value = args.value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { value, stripConstraints: options.stripConstraints ?? false }
  );
}
