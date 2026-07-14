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

  async searchEmployee(name: string) {
    await this.page.locator('#dt-search-0').waitFor({ state: 'visible' });
    await this.page.locator('#dt-search-0').fill(name);
  }

  async clickEmployeeProfileIcon() {
    await this.page.locator('#user_table > tbody > tr > td:nth-child(7) > a > i').first().click();
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
    const response = await this.page.request.get(href);
    const body = await response.body();
    const filePath = path.join(downloadDir, 'employees.csv');
    fs.writeFileSync(filePath, body);
    return filePath;
  }
}
