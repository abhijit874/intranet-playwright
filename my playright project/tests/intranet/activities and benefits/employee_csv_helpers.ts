import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { readCsvRecords } from '../utils/csv_report_filter';

// One row of the Employees CSV export, reduced to the columns eligibility
// decisions need. The export carries Grade AND Email for every employee —
// which the UI never shows together: the Employees tab has the grade but no
// email, and the employee pickers have the email but no grade. Downloading the
// export once therefore replaces scraping and joining those two screens.
export interface EmployeeCsvRow {
  empId: string;
  name: string;
  grade: string; // e.g. "J11"
  email: string;
}

let rowsCache: EmployeeCsvRow[] | null = null;

const CSV_PATH = path.resolve(__dirname, '../downloads/employees.csv');

function parseEmployeeCsv(filePath: string): EmployeeCsvRow[] {
  return readCsvRecords(filePath)
    .map((r) => ({
      empId: (r['Employee Id'] ?? '').trim(),
      name: (r['Name'] ?? '').trim(),
      grade: (r['Grade'] ?? '').trim().toUpperCase(),
      email: (r['Email'] ?? '').trim(),
      status: (r['Status'] ?? '').trim().toLowerCase(),
    }))
    // Only approved (active) employees can sign in or be picked in forms.
    .filter((r) => r.empId && r.grade && r.status === 'approved')
    .map(({ status: _status, ...row }) => row);
}

// Returns the rows of the Employees CSV export. Employee data changes rarely,
// and nothing is hardcoded against it (callers only search it by grade), so the
// file on disk is reused indefinitely: a download happens only when there is no
// usable file yet, or when a caller passes { refresh: true } because the current
// file produced no eligible employee — the fresh download then replaces the old
// file. Signs in as hr (to reach the Employees tab) ONLY when it actually
// downloads — callers must establish the session they need afterwards.
export async function loadEmployeeCsv(
  page: Page,
  opts: { refresh?: boolean } = {}
): Promise<EmployeeCsvRow[]> {
  if (!opts.refresh) {
    if (rowsCache) return rowsCache;

    // Reuse the download from a previous run — no login, no waiting.
    if (fs.existsSync(CSV_PATH)) {
      const rows = parseEmployeeCsv(CSV_PATH);
      if (rows.length) {
        rowsCache = rows;
        return rows;
      }
      // An empty or unreadable file falls through to a fresh download.
    }
  }

  const employees = new EmployeeListPage(page);
  await employees.loginAs('hr');
  await employees.navigateToEmployees();
  const filePath = await employees.downloadEmployeeCsv(path.dirname(CSV_PATH));

  const rows = parseEmployeeCsv(filePath);
  if (!rows.length) throw new Error('Employees CSV export contained no approved employees.');
  rowsCache = rows;
  return rows;
}

// Numeric part of a grade like "J10" -> 10; null when the value is not J-form.
export function gradeNumber(grade: string): number | null {
  const m = /^J(\d+)$/.exec(grade);
  return m ? Number(m[1]) : null;
}
