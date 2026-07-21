import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader';

export class EmployeeListPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateToEmployees() {
    await this.page.locator('span.fs-6.ms-2', { hasText: /^Employees$/ }).click();
  }

  async switchToCompactView() {
    await this.page.getByText('See Compact View').click();
  }

  async showAllEmployees() {
    await this.page.getByText('Show All').click();
  }

  // Returns the Emp IDs of employees whose grade falls within [minGrade, maxGrade]
  // (the Employees table's Grade column holds values like "J11"). The employee
  // pickers elsewhere label options "email (id)", so Emp ID is the join key.
  async getEmployeeIdsWithGradeInRange(minGrade = 7, maxGrade = 11): Promise<string[]> {
    await this.navigateToEmployees();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    const rows = this.page.locator('table tbody tr');
    try {
      await expect(rows.first()).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Employees table did not load.');
    }

    const ids = await rows.evaluateAll((trs, range) => {
      const [min, max] = range as number[];
      return trs
        .map((tr) => {
          const td = Array.from(tr.querySelectorAll('td')).map((c) =>
            (c.textContent || '').replace(/\s+/g, ' ').trim()
          );
          return { empId: td[0], grade: td[6] };
        })
        .filter(({ empId, grade }) => {
          const m = /^J(\d+)$/.exec(grade || '');
          return !!empId && !!m && Number(m[1]) >= min && Number(m[1]) <= max;
        })
        .map(({ empId }) => empId);
    }, [minGrade, maxGrade]);

    if (!ids.length) {
      throw new Error(`No employees found with a grade between J${minGrade} and J${maxGrade}.`);
    }
    return ids;
  }

  async searchEmployee(name: string) {
    await this.page.locator('#dt-search-0').waitFor({ state: 'visible' });
    await this.page.locator('#dt-search-0').fill(name);
  }

  async clickEmployeeProfileIcon() {
    await this.page.locator('#user_table > tbody > tr > td:nth-child(7) > a > i').first().click();
  }

  // --- Random / dynamic pickers ---------------------------------------------
  // The three filters are positional Select2 widgets (skill, project, location).
  // Any listed value is valid, so tests can pick one at random instead of pinning
  // a specific skill/project/location that may later disappear.
  private async filterRandomAt(index: number, label: string): Promise<string> {
    await this.page.locator('.select2-selection__rendered').nth(index).click();
    const options = this.page.locator('.select2-results__option');
    try {
      await expect(options.first()).toBeVisible({ timeout: 15000 });
    } catch {
      throw new Error(`${label} filter did not open or has no options.`);
    }
    const values = (await options.allTextContents())
      .map((t) => t.trim())
      .filter((t) => t && !/^\s*(--)?\s*select/i.test(t) && !/^no results/i.test(t));
    if (!values.length) throw new Error(`No selectable options in the ${label} filter.`);

    const choice = values[Math.floor(Math.random() * values.length)];
    await options.filter({ hasText: choice }).first().click();
    return choice;
  }

  async filterByRandomSkill(): Promise<string> {
    return this.filterRandomAt(0, 'skill');
  }

  async filterByRandomProject(): Promise<string> {
    return this.filterRandomAt(1, 'project');
  }

  async filterByRandomLocation(): Promise<string> {
    return this.filterRandomAt(2, 'location');
  }

  // Returns the name of an employee currently listed, so tests can act on a real
  // employee without hardcoding one who may leave the system.
  async getFirstEmployeeName(): Promise<string> {
    const row = this.page.locator('table tbody tr').first();
    try {
      await expect(row).toBeVisible({ timeout: 20000 });
    } catch {
      throw new Error('Employee list is empty — cannot pick an employee.');
    }
    const name = ((await row.locator('td').nth(1).innerText().catch(() => '')) ?? '').trim();
    if (!name) throw new Error('Could not read an employee name from the list.');
    return name;
  }

  async filterBySkill(skillName: string) {
    await this.page.locator('.select2-selection__rendered').first().click();
    const searchInput = this.page.locator('.select2-container--open .select2-search__field').first();
    try {
      await expect(searchInput).toBeVisible();
    } catch {
      throw new Error('Skill filter search input not found.');
    }
    await searchInput.fill(skillName);
    await searchInput.press('Enter');
  }

  async filterByProject(projectName: string) {
    await this.page.locator('.select2-selection__rendered').nth(1).click();
    const searchInput = this.page.locator('.select2-container--open .select2-search__field').first();
    try {
      await expect(searchInput).toBeVisible();
    } catch {
      throw new Error('Project filter search input not found.');
    }
    await searchInput.fill(projectName);
    await searchInput.press('Enter');
  }

  async filterByLocation(locationName: string) {
    await this.page.locator('.select2-selection__rendered').nth(2).click();
    const searchInput = this.page.locator('.select2-container--open .select2-search__field').first();
    try {
      await expect(searchInput).toBeVisible();
    } catch {
      throw new Error('Location filter search input not found.');
    }
    await searchInput.fill(locationName);
    await searchInput.press('Enter');
  }

  async clickDownloadIcon() {
    await this.page.locator('a.btn.btn-light.p-1.ms-auto > i').click();
  }

  async downloadEmployeeCsv(downloadDir: string): Promise<string> {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const href = await this.page.locator('a.btn.btn-light.p-1.ms-auto').getAttribute('href');
    if (!href) throw new Error('Download button not found or missing href');
    // Generating the employee export takes well over the default 15s action
    // timeout, so give the request its own generous budget.
    const response = await this.page.request.get(href, { timeout: 120_000 });
    const body = await response.body();
    const filePath = path.join(downloadDir, 'employees.csv');
    fs.writeFileSync(filePath, body);
    return filePath;
  }
}
