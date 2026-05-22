import { expect, Page } from '@playwright/test';

export async function openContributions(page: Page) {
  await page.getByText('Activity and Benefits').click();
  const menuContribution = page.locator('#contributionMenu').getByText('Contributions');
  if (await menuContribution.count()) {
    await menuContribution.first().click();
    return;
  }

  await page.getByRole('link', { name: /^Contributions$/i }).first().click();
}

export async function pickCategory(page: Page, category: string) {
  await page.locator('#select2-category-container').click();
  await page.locator('.select2-results__option', { hasText: category }).click();
}

export async function assertContributionSaved(page: Page) {
  const flash = page.locator('#flashes');
  const alert = page.getByRole('alert');

  if (await flash.count()) {
    await expect(flash).toContainText(/saved successfully|success|created|submitted/i);
    return;
  }

  await expect(alert).toContainText(/saved successfully|success|created|submitted/i);
}

export async function assertContributionUpdated(page: Page) {
  const flash = page.locator('#flashes');
  const alert = page.getByRole('alert');

  if (await flash.count()) {
    await expect(flash).toContainText(/updated|saved successfully|success/i);
    return;
  }

  await expect(alert).toContainText(/updated|saved successfully|success/i);
}

export async function openRowForEdit(page: Page, title: string) {
  const row = page.locator('table tbody tr', { hasText: title }).first();
  await expect(row).toBeVisible({ timeout: 20000 });

  const selectors = [
    row.getByRole('button', { name: /edit/i }),
    row.getByRole('link', { name: /edit/i }),
    row.locator('a[title*="Edit" i], button[title*="Edit" i]').first(),
    row.locator('a:has(i.fa-edit), button:has(i.fa-edit), a:has(i[class*="edit"]), button:has(i[class*="edit"])').first(),
    row.locator('text=/^edit$/i').first(),
  ];

  for (const target of selectors) {
    if (await target.count()) {
      await target.click();
      return;
    }
  }

  throw new Error(`Edit action was not found for contribution row with title: ${title}`);
}

export async function submitEditedContribution(page: Page) {
  await page.getByRole('button', { name: /update|submit|save/i }).click();
}

export async function searchContribution(page: Page, text: string) {
  const candidates = [
    page.getByPlaceholder(/search/i).first(),
    page.locator('input[type="search"]').first(),
    page.locator('#contributions_table_filter input, #DataTables_Table_0_filter input').first(),
  ];

  for (const input of candidates) {
    if (await input.count()) {
      await input.fill(text);
      await input.press('Enter');
      return;
    }
  }
}

export async function openFirstSearchResultForEdit(page: Page) {
  const rows = page.locator('table tbody tr');
  const rowCount = await rows.count();
  if (!rowCount) {
    throw new Error('No rows found in contributions table after search.');
  }

  for (let i = 0; i < rowCount; i += 1) {
    const row = rows.nth(i);
    const selectors = [
      row.locator(
        'a[title*="Edit" i]:not(.disabled), button[title*="Edit" i]:not(.disabled), a[aria-label*="Edit" i]:not(.disabled), button[aria-label*="Edit" i]:not(.disabled)'
      ).first(),
      row.locator(
        'a:has(i.fa-edit):not(.disabled), button:has(i.fa-edit):not(.disabled), a:has(i[class*="edit"]):not(.disabled), button:has(i[class*="edit"]):not(.disabled)'
      ).first(),
      row.getByRole('button', { name: /edit/i }).first(),
      row.getByRole('link', { name: /edit/i }).first(),
      row.locator('text=/^edit$/i').first(),
    ];

    for (const target of selectors) {
      if (!(await target.count())) {
        continue;
      }

      const cls = (await target.getAttribute('class')) ?? '';
      const ariaDisabled = (await target.getAttribute('aria-disabled')) ?? '';
      const tooltip = ((await target.getAttribute('data-bs-original-title')) ?? '').toLowerCase();
      const title = ((await target.getAttribute('title')) ?? '').toLowerCase();
      const isDisabled =
        /\bdisabled\b/i.test(cls) ||
        ariaDisabled.toLowerCase() === 'true' ||
        tooltip.includes('edit disabled') ||
        title.includes('edit disabled');

      if (isDisabled) {
        continue;
      }

      await target.scrollIntoViewIfNeeded();
      await target.click({ timeout: 10000 });
      return;
    }
  }

  throw new Error('No editable row found in search results (all rows might be approved/locked).');
}

export async function openEditableFromSearchTerms(
  page: Page,
  terms: string[],
  options: { throwOnMissing?: boolean } = {}
) {
  const throwOnMissing = options.throwOnMissing ?? true;
  let lastError: unknown;
  for (const term of terms) {
    await searchContribution(page, term);
    try {
      await openFirstSearchResultForEdit(page);
      return true;
    } catch (error) {
      lastError = error;
    }
  }

  if (!throwOnMissing) {
    return false;
  }

  if (lastError instanceof Error) {
    throw new Error(
      `Could not find editable contribution for search terms [${terms.join(', ')}]. Last error: ${lastError.message}`
    );
  }

  throw new Error(`Could not find editable contribution for search terms [${terms.join(', ')}].`);
}
