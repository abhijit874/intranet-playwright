import { Page, Locator, expect } from '@playwright/test';

export function currentDateValue(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
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
  await expect(searchInput).toHaveAttribute('aria-activedescendant', /.+/);
  const activeOptionId = await searchInput.getAttribute('aria-activedescendant');
  if (!activeOptionId) {
    throw new Error(`No active Select2 option found for ${containerSelector}`);
  }
  const activeOption = page.locator(`#${activeOptionId}`);
  await expect(activeOption).toBeVisible();
  await activeOption.click();
  await expect(page.locator(containerSelector)).toContainText(expectedText);
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

export async function setDateByEvaluate(locator: Locator, value: string) {
  await locator.evaluate((el: HTMLInputElement, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}
