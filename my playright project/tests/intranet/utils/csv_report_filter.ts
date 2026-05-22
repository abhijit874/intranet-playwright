import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

type CsvRow = Record<string, string>;

type CsvReportFilterOptions = {
  prefix?: string;
  fallbackPrefixes?: string[];
  defaultDateField?: string;
  outputSubdir?: string;
  outputSuffix?: string;
};

type CsvReportFilterResult = {
  filteredPath: string;
  totalRows: number;
  filteredRows: number;
  headers: string[];
  query: string;
  queryField: string;
  resolvedQueryField: string;
};

function toDateOrNull(value: string | undefined): Date | null {
  if (!value) return null;
  const normalized = value.trim();
  const dayMonthYear = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dayMonthYear) {
    const [, day, month, year] = dayMonthYear;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(records: CsvRow[], headers: string[]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of records) {
    lines.push(headers.map((header) => csvEscape(row[header] ?? '')).join(','));
  }
  return lines.join('\n');
}

function readEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function isTruthy(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'y';
}

export function readCsvRecords(filePath: string): CsvRow[] {
  return parse(fs.readFileSync(filePath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as CsvRow[];
}

export function resolveCsvHeader(headers: string[], requestedHeader: string): string {
  return headers.find((header) => header.toLowerCase() === requestedHeader.toLowerCase()) ?? requestedHeader;
}

export function csvValueMatches(value: string | undefined, query: string, exact = false): boolean {
  const normalizedValue = String(value ?? '').toLowerCase();
  const normalizedQuery = query.toLowerCase();
  return exact ? normalizedValue.trim() === normalizedQuery.trim() : normalizedValue.includes(normalizedQuery);
}

export function processCsvReport(
  downloadedFilePath: string,
  options: CsvReportFilterOptions = {}
): CsvReportFilterResult {
  const prefix = options.prefix ?? 'REPORT';
  const fallbackPrefixes = options.fallbackPrefixes ?? [];
  const prefixes = [prefix, ...fallbackPrefixes];
  const envKeys = (name: string) => prefixes.map((entry) => `${entry}_${name}`);

  const records = readCsvRecords(downloadedFilePath);
  const headers = records.length ? Object.keys(records[0]) : [];
  const query = readEnv(envKeys('QUERY')).trim().toLowerCase();
  const queryField = readEnv(envKeys('QUERY_FIELD')).trim();
  const queryExact = isTruthy(readEnv(envKeys('QUERY_EXACT')));
  const fromDate = toDateOrNull(readEnv(envKeys('FROM')).trim());
  const toDate = toDateOrNull(readEnv(envKeys('TO')).trim());
  const dateField = readEnv(envKeys('DATE_FIELD')).trim() || options.defaultDateField || 'Start Date';
  const outputSubdir = options.outputSubdir ?? 'filtered';
  const outputSuffix = options.outputSuffix ?? 'filtered';

  const resolvedQueryField = queryField ? resolveCsvHeader(headers, queryField) : '';
  const hasQueryField = Boolean(queryField);

  const filtered = records.filter((row) => {
    const textMatches = !query
      ? true
      : hasQueryField
        ? csvValueMatches(row[resolvedQueryField], query, queryExact)
        : Object.values(row).some((value) => csvValueMatches(value, query, queryExact));
    if (!textMatches) return false;

    if (!fromDate && !toDate) return true;
    const rowDate = toDateOrNull(row[dateField]);
    if (!rowDate) return false;
    if (fromDate && rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;
    return true;
  });

  const outputDir = path.join(path.dirname(downloadedFilePath), outputSubdir);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputName = `${path.parse(downloadedFilePath).name}-${outputSuffix}.csv`;
  const filteredPath = path.join(outputDir, outputName);
  fs.writeFileSync(filteredPath, toCsv(filtered, headers), 'utf-8');

  return {
    filteredPath,
    totalRows: records.length,
    filteredRows: filtered.length,
    headers,
    query,
    queryField,
    resolvedQueryField,
  };
}
