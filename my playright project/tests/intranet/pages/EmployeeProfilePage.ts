import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import { selectFromSingleSelect2, selectRandomOption } from '../utils/test_helpers';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader';

export class EmployeeProfilePage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateToProfile() {
    await this.page.locator('a', { hasText: 'Profile' }).first().click();
  }

  async clickProfileTab(tabName: string) {
    await this.page.getByRole('tab', { name: tabName }).click();
  }

  // Drive the native <select>s rather than the Select2 overlay: the overlay's
  // rendered span for the second skill is not reliably clickable, while the native
  // controls hold the full skill list and are what actually submit.
  async updateSkills(skill1: string, skill2: string) {
    await this.page.locator('#public_profile_technical_skills_1').selectOption({ label: skill1 });
    await this.page.locator('#public_profile_technical_skills_2').selectOption({ label: skill2 });
    await this.page.getByRole('button', { name: 'Update Skills' }).click();
  }

  // Picks two random skills — any listed skill is valid and none is asserted.
  async updateRandomSkills(): Promise<{ first: string; second: string }> {
    const first = await selectRandomOption(this.page, '#public_profile_technical_skills_1');
    const second = await selectRandomOption(this.page, '#public_profile_technical_skills_2');
    await this.page.getByRole('button', { name: 'Update Skills' }).click();
    return { first, second };
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

  async openFeedbackForm() {
    await this.page.getByText('Add Feedback Detail').click();
  }

  async saveFeedback() {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async assertFeedbackNotAdded() {
    await this.page.waitForLoadState('networkidle');
    const successFlash = this.page
      .locator('#flashes')
      .filter({ hasText: 'Feedback added Successfully' });
    await expect(
      successFlash,
      'Feedback was added without required fields — server-side validation was bypassed.'
    ).toHaveCount(0);
  }

  async updateEmployeeRole(role: string) {
    await this.page.locator('#user_role').selectOption(role);
    await this.page.locator('#update-status-button').click();
  }
}
