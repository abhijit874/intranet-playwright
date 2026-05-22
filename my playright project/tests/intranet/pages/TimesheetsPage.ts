import { expect, Page } from '@playwright/test';
import { login } from '../utils/login_helper';

type UserKey = 'employee' | 'hr' | 'admin' | 'leader';

export class TimesheetsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.locator('a.nav-link[href="/time_sheets"]').click();
    await expect(this.page).toHaveURL(/time_sheets/i);
  }

  async clickAddTimesheet() {
    await this.page.locator('header').getByRole('link').first().click();
  }

  async selectProject(projectName: string) {
    await this.page.locator('#active_projects').selectOption({ label: projectName });
  }

  async fillDate(index: number, date: string) {
    await this.page.locator(`#date-${index}`).fill(date);
  }

  async selectDuration(index: number, duration: string) {
    await this.page.locator(`#duration-${index}`).selectOption({ label: duration });
  }

  async fillDescription(index: number, description: string) {
    await this.page.locator(`#user_time_sheets_attributes_${index}_description`).fill(description);
  }

  async submit() {
    await this.page.locator('input[type="submit"]').click();
  }

  async clickFirstTimesheetLink() {
    await this.page.locator('table tbody tr').first().locator('a').first().click();
  }

  // --- Reports navigation ---

  async navigateToReports() {
    await this.page.locator('aside nav a').nth(10).click();
  }

  async clickExportReports() {
    await this.page.getByText('Export Reports').click();
  }

  // --- Attendance report ---

  async clickTimesheetAttendanceReport() {
    await this.page.getByText('Monthly Timesheet Report').click();
    await this.page.getByText('Timesheet and Attendance Report').click();
  }

  async fillAttendanceFromDate(date: string) {
    await this.page
      .locator('#project_wise_monthly_time_sheet_report > form > div:nth-child(2) > input')
      .fill(date);
  }

  async fillAttendanceToDate(date: string) {
    await this.page
      .locator('#project_wise_monthly_time_sheet_report > form > div:nth-child(3) > input')
      .fill(date);
  }

  async uploadAttendanceFile(filePath: string) {
    await this.page.locator('#attendance_report').setInputFiles(filePath);
  }

  async submitAttendanceReport() {
    await this.page.getByText('Send report to respective managers.').click();
  }

  // --- Employee categorisation report ---

  async clickEmployeeCategorisationReport() {
    await this.page.getByText('Employee Categorisation Report').click();
  }

  async selectCategorisationMonth(month: string) {
    await this.page.locator('#date_date_2i').selectOption({ label: month });
  }

  async selectCategorisationYear(year: string) {
    await this.page.locator('#date_date_1i').selectOption({ label: year });
  }

  async submitCategorisationReport() {
    await this.page.locator('#resource_export > form > input').click();
  }

  // --- Monthly timesheet report ---

  async clickMonthlyTimesheetReport() {
    await this.page.getByText('Monthly Timesheet Report').click();
  }

  async fillMonthlyFromDate(date: string) {
    await this.page
      .locator('#timesheet_monthly_export > form > div:nth-child(1) > input')
      .fill(date);
  }

  async fillMonthlyToDate(date: string) {
    await this.page
      .locator('#timesheet_monthly_export > form > div:nth-child(2) > input')
      .fill(date);
  }

  async submitMonthlyReport() {
    await this.page.locator('#timesheet_monthly_export > form > input').click();
  }
}
