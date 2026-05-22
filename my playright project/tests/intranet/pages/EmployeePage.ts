import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { selectFromSingleSelect2 } from '../utils/test_helpers';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader';

export class EmployeePage {
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

  async navigateToProfile() {
    await this.page.locator('a', { hasText: 'Profile' }).first().click();
  }

  async clickProfileTab(tabName: string) {
    await this.page.getByRole('tab', { name: tabName }).click();
  }

  async filterBySkill(skillName: string) {
    await this.page.locator('.select2-selection__rendered').first().click();
    const searchInput = this.page.locator('.select2-container--open .select2-search__field').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(skillName);
    await searchInput.press('Enter');
  }

  async filterByProject(projectName: string) {
    await this.page.locator('.select2-selection__rendered').nth(1).click();
    const searchInput = this.page.locator('.select2-container--open .select2-search__field').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(projectName);
    await searchInput.press('Enter');
  }

  async filterByLocation(locationName: string) {
    await this.page.locator('.select2-selection__rendered').nth(2).click();
    const searchInput = this.page.locator('.select2-container--open .select2-search__field').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(locationName);
    await searchInput.press('Enter');
  }

  async updateSkills(skill1: string, skill2: string) {
    await selectFromSingleSelect2(
      this.page,
      '#select2-public_profile_technical_skills_1-container',
      skill1
    );
    await selectFromSingleSelect2(
      this.page,
      '#select2-public_profile_technical_skills_2-container',
      skill2
    );
    await this.page.getByRole('button', { name: 'Update Skills' }).click();
  }

  async addFeedback(feedbackData: {
    type: string;
    project: string;
    interviewer: string;
    date: string;
    status: string;
    comment: string;
  }) {
    await this.page.getByText('Add Feedback Detail').click();
    await selectFromSingleSelect2(
      this.page,
      '#select2-interview_track_evaluation_type-container',
      feedbackData.type
    );
    await selectFromSingleSelect2(
      this.page,
      '#select2-interview_track_project_id-container',
      feedbackData.project
    );
    await this.page.locator('#interview_track_interviewer').fill(feedbackData.interviewer);
    await this.page.locator('#interview_track_date').fill(feedbackData.date);
    await selectFromSingleSelect2(
      this.page,
      '#select2-interview_track_status-container',
      feedbackData.status
    );
    await this.page.locator('#interview_track_comment').fill(feedbackData.comment);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async updateEmployeeRole(role: string) {
    await this.page.locator('#user_role').selectOption(role);
    await this.page.locator('#update-status-button').click();
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
