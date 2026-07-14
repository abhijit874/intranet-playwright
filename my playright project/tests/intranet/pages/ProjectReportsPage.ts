import { Page } from '@playwright/test';
import { login } from '../utils/login_helper';
import * as fs from 'fs';
import * as path from 'path';

type UserKey = 'employee' | 'hr' | 'admin' | 'sales';

export class ProjectReportsPage {
  constructor(private page: Page) {}

  async loginAs(user: UserKey = 'employee') {
    await login(this.page, user);
  }

  async navigateTo() {
    await this.page.locator('a[href="/projects"]').first().click({ noWaitAfter: true });
    await this.page.waitForURL((url) => url.pathname === '/projects', { timeout: 30000 });
  }

  async clickDownloadIcon() {
    await this.page.locator('i.ri-file-download-line.fs-3.text-dark').first().click();
  }

  async downloadProjectsReport(downloadDir: string) {
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('a.project-report.dropdown-item.fs-6', { hasText: 'Projects Report' }).click(),
    ]);
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    return filePath;
  }

  async downloadProjectTeamsReport() {
    await this.page
      .locator('a.project-team-report.dropdown-item.fs-6', { hasText: 'Project Teams Report' })
      .click();
  }
}
